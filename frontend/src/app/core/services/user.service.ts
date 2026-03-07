import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  distinctUntilChanged,
  finalize,
  map,
  of,
  shareReplay,
  tap,
} from 'rxjs';
import { ApiResponse, FavouriteMeal, Meal, User } from '../models/api.models';
import { AuthService } from './auth.service';

type UserAddressPayload = {
  street?: string;
  city?: string;
  notes?: string;
};

type UpdateMePayload = {
  name?: string;
  phone?: string;
  address?: UserAddressPayload;
};

type UpdatePasswordPayload = {
  currentPassword: string;
  password: string;
  passwordConfirm: string;
};

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly apiPrefix = '/api/v1/users';
  private readonly favouriteMealsSubject = new BehaviorSubject<FavouriteMeal[]>([]);
  private readonly favouriteMealsLoadingSubject = new BehaviorSubject<boolean>(
    false,
  );
  private readonly usersSubject = new BehaviorSubject<User[]>([]);
  private favouritesLoadedForUserId: string | null = null;
  private pendingFavouritesRequest$?: Observable<FavouriteMeal[]>;

  readonly favouriteMeals$ = this.favouriteMealsSubject.asObservable();
  readonly favouriteMealsLoading$ = this.favouriteMealsLoadingSubject.asObservable();
  readonly favouriteMealIds$ = this.favouriteMeals$.pipe(
    map(
      (favourites) =>
        new Set(
          favourites
            .map((fav) => this.getMealIdFromFavourite(fav))
            .filter((mealId): mealId is string => Boolean(mealId)),
        ),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  readonly users$ = this.usersSubject.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService,
  ) {
    this.authService.currentUser$.subscribe((user) => {
      this.syncFavouritesFromSession(user);
    });
  }

  isMealFavourite$(mealId: string): Observable<boolean> {
    return this.favouriteMealIds$.pipe(
      map((ids) => ids.has(mealId)),
      distinctUntilChanged(),
    );
  }

  ensureFavouritesLoaded(force = false): Observable<FavouriteMeal[]> {
    const userId = this.authService.currentUser?._id;
    if (!userId) {
      this.clearFavourites();
      return of([]);
    }

    if (!force && this.favouritesLoadedForUserId === userId) {
      return of(this.favouriteMealsSubject.value);
    }

    return this.fetchFavourites(userId);
  }

  getMe(): Observable<User> {
    return this.http
      .get<ApiResponse<{ user: User }>>(`${this.apiPrefix}/me`)
      .pipe(
        map((res) => this.pick(res.data?.user, 'user')),
        tap((user) => this.syncSessionUser(user)),
      );
  }

  updateMe(payload: UpdateMePayload): Observable<User> {
    return this.http
      .patch<ApiResponse<{ user: User }>>(`${this.apiPrefix}/me`, payload)
      .pipe(
        map((res) => this.pick(res.data?.user, 'user')),
        tap((user) => this.syncSessionUser(user)),
      );
  }

  deleteMe(): Observable<void> {
    return this.http.delete<void>(`${this.apiPrefix}/me`).pipe(
      tap(() => {
        this.authService.clearSession();
        this.clearFavourites();
      }),
    );
  }

  updatePassword(payload: UpdatePasswordPayload): Observable<User> {
    return this.http
      .patch<ApiResponse<{ user: User }>>(`${this.apiPrefix}/me/update-password`, payload)
      .pipe(
        map((res) => this.pick(res.data?.user, 'user')),
        tap((user) => this.syncSessionUser(user)),
      );
  }

  getFavourites(): Observable<FavouriteMeal[]> {
    return this.ensureFavouritesLoaded(true);
  }

  toggleFavourite(mealId: string): Observable<FavouriteMeal[]> {
    return this.http
      .patch<ApiResponse<{ favouriteMeals: FavouriteMeal[] }>>(
        `${this.apiPrefix}/me/favourites/${mealId}`,
        {},
      )
      .pipe(
        map((res) => this.pick(res.data?.favouriteMeals, 'favouriteMeals')),
        tap((favourites) => {
          this.setFavourites(favourites, this.authService.currentUser?._id ?? null);
          this.authService.patchSessionUser({ favouriteMeals: favourites });
        }),
      );
  }

  uploadProfilePhoto(imageFile: File): Observable<User> {
    const formData = new FormData();
    formData.append('image', imageFile);
    return this.http
      .patch<ApiResponse<{ user: User }>>(`${this.apiPrefix}/me/photo`, formData)
      .pipe(
        map((res) => this.pick(res.data?.user, 'user')),
        tap((user) => this.syncSessionUser(user)),
      );
  }

  deleteProfilePhoto(): Observable<User> {
    return this.http
      .delete<ApiResponse<{ user: User }>>(`${this.apiPrefix}/me/photo`)
      .pipe(
        map((res) => this.pick(res.data?.user, 'user')),
        tap((user) => this.syncSessionUser(user)),
      );
  }

  getAllUsers(): Observable<User[]> {
    return this.http
      .get<ApiResponse<{ users: User[] }>>(this.apiPrefix)
      .pipe(
        map((res) => this.pick(res.data?.users, 'users')),
        tap((users) => this.usersSubject.next(users)),
      );
  }

  getUserById(id: string): Observable<User> {
    return this.http
      .get<ApiResponse<{ user: User }>>(`${this.apiPrefix}/${id}`)
      .pipe(map((res) => this.pick(res.data?.user, 'user')));
  }

  createUser(payload: Partial<User> & { password: string }): Observable<User> {
    return this.http
      .post<ApiResponse<{ user: User }>>(this.apiPrefix, payload)
      .pipe(
        map((res) => this.pick(res.data?.user, 'user')),
        tap((user) => {
          const current = this.usersSubject.value;
          this.usersSubject.next([...current, user]);
        }),
      );
  }

  updateUser(id: string, payload: Partial<User>): Observable<User> {
    return this.http
      .patch<ApiResponse<{ user: User }>>(`${this.apiPrefix}/${id}`, payload)
      .pipe(
        map((res) => this.pick(res.data?.user, 'user')),
        tap((user) => {
          const current = this.usersSubject.value;
          const updated = current.map((u) => (u._id === id ? user : u));
          this.usersSubject.next(updated);
        }),
      );
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiPrefix}/${id}`).pipe(
      tap(() => {
        const current = this.usersSubject.value;
        this.usersSubject.next(current.filter((u) => u._id !== id));
      }),
    );
  }

  updateUserRole(id: string, role: 'user' | 'admin'): Observable<User> {
    return this.http
      .patch<ApiResponse<{ user: User }>>(`${this.apiPrefix}/${id}/role`, { role })
      .pipe(
        map((res) => this.pick(res.data?.user, 'user')),
        tap((user) => {
          const current = this.usersSubject.value;
          const updated = current.map((u) => (u._id === id ? user : u));
          this.usersSubject.next(updated);
        }),
      );
  }

  private fetchFavourites(userId: string): Observable<FavouriteMeal[]> {
    if (!this.pendingFavouritesRequest$) {
      this.favouriteMealsLoadingSubject.next(true);
      this.pendingFavouritesRequest$ = this.http
        .get<ApiResponse<{ favouriteMeals: FavouriteMeal[] }>>(
          `${this.apiPrefix}/me/favourites`,
        )
        .pipe(
          map((res) => this.pick(res.data?.favouriteMeals, 'favouriteMeals')),
          tap((favourites) => {
            this.setFavourites(favourites, userId);
            this.authService.patchSessionUser({ favouriteMeals: favourites });
          }),
          finalize(() => {
            this.favouriteMealsLoadingSubject.next(false);
            this.pendingFavouritesRequest$ = undefined;
          }),
          shareReplay(1),
        );
    }

    return this.pendingFavouritesRequest$;
  }

  private syncSessionUser(user: User): void {
    this.authService.updateSessionUser(user);
    this.syncFavouritesFromSession(user);
  }

  private syncFavouritesFromSession(user: User | null): void {
    if (!user) {
      this.clearFavourites();
      return;
    }

    if (Array.isArray(user.favouriteMeals)) {
      if (user.favouriteMeals.length === 0) {
        this.setFavourites(user.favouriteMeals, user._id);
        return;
      }

      const hasPopulatedMeals = user.favouriteMeals.every((fav) =>
        this.isMealObject(fav.meal),
      );
      this.setFavourites(user.favouriteMeals, hasPopulatedMeals ? user._id : null);

      if (hasPopulatedMeals) {
        return;
      }
    }

    if (
      this.favouritesLoadedForUserId !== user._id &&
      !this.pendingFavouritesRequest$
    ) {
      this.ensureFavouritesLoaded(true).subscribe({
        error: () => undefined,
      });
      return;
    }
  }

  private setFavourites(
    favourites: FavouriteMeal[],
    userId: string | null,
  ): void {
    this.favouriteMealsSubject.next(favourites);
    this.favouritesLoadedForUserId = userId;
  }

  private clearFavourites(): void {
    this.pendingFavouritesRequest$ = undefined;
    this.favouriteMealsLoadingSubject.next(false);
    this.setFavourites([], null);
  }

  private pick<T>(value: T | undefined, key: string): T {
    if (value === undefined || value === null) {
      throw new Error(`Malformed response: missing ${key}`);
    }
    return value;
  }

  private getMealIdFromFavourite(favourite: FavouriteMeal): string | null {
    const { meal } = favourite;
    if (typeof meal === 'string') {
      return meal;
    }
    if (this.isMealObject(meal)) {
      return meal._id;
    }
    return null;
  }

  private isMealObject(meal: Meal | string | undefined): meal is Meal {
    return typeof meal === 'object' && meal !== null && typeof meal._id === 'string';
  }
}

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { ApiResponse, Meal } from '../models/api.models';

type MealPayload = {
  name: string;
  description: string;
  price: number;
  categoryId: string;
  preparationTime: number;
};

@Injectable({
  providedIn: 'root',
})
export class MealService {
  private readonly apiPrefix = '/api/v1/meals';
  private readonly mealsSubject = new BehaviorSubject<Meal[]>([]);
  private readonly currentMealSubject = new BehaviorSubject<Meal | null>(null);
  readonly meals$ = this.mealsSubject.asObservable();
  readonly currentMeal$ = this.currentMealSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  getMeals(categoryId?: string): Observable<Meal[]> {
    let params = new HttpParams();
    if (categoryId) {
      params = params.set('categoryId', categoryId);
    }

    return this.http
      .get<ApiResponse<{ meals: Meal[] }>>(this.apiPrefix, { params })
      .pipe(
        map((res) => this.pick(res.data?.meals, 'meals')),
        tap((meals) => this.mealsSubject.next(meals)),
      );
  }

  getMealsByCategory(categoryId: string): Observable<Meal[]> {
    return this.getMeals(categoryId);
  }

  getMealById(id: string): Observable<Meal> {
    return this.http
      .get<ApiResponse<{ meal: Meal }>>(`${this.apiPrefix}/${id}`)
      .pipe(
        map((res) => this.pick(res.data?.meal, 'meal')),
        tap((meal) => this.currentMealSubject.next(meal)),
      );
  }

  createMeal(payload: MealPayload, imageFile: File): Observable<Meal> {
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('description', payload.description);
    formData.append('price', String(payload.price));
    formData.append('categoryId', payload.categoryId);
    formData.append('preparationTime', String(payload.preparationTime));
    formData.append('image', imageFile);

    return this.http
      .post<ApiResponse<{ meal: Meal }>>(this.apiPrefix, formData)
      .pipe(
        map((res) => this.pick(res.data?.meal, 'meal')),
        tap((meal) => {
          const current = this.mealsSubject.value;
          this.mealsSubject.next([...current, meal]);
        }),
      );
  }

  updateMeal(
    id: string,
    payload: Partial<MealPayload>,
    imageFile?: File,
  ): Observable<Meal> {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    if (imageFile) {
      formData.append('image', imageFile);
    }

    return this.http
      .patch<ApiResponse<{ meal: Meal }>>(`${this.apiPrefix}/${id}`, formData)
      .pipe(
        map((res) => this.pick(res.data?.meal, 'meal')),
        tap((meal) => {
          const meals = this.mealsSubject.value;
          const updated = meals.map((m) => (m._id === id ? meal : m));
          this.mealsSubject.next(updated);
          if (this.currentMealSubject.value?._id === id) {
            this.currentMealSubject.next(meal);
          }
        }),
      );
  }

  deleteMeal(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiPrefix}/${id}`).pipe(
      tap(() => {
        const meals = this.mealsSubject.value;
        this.mealsSubject.next(meals.filter((m) => m._id !== id));
        if (this.currentMealSubject.value?._id === id) {
          this.currentMealSubject.next(null);
        }
      }),
    );
  }

  private pick<T>(value: T | undefined, key: string): T {
    if (value === undefined || value === null) {
      throw new Error(`Malformed response: missing ${key}`);
    }
    return value;
  }
}

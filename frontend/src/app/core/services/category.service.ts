import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { ApiResponse, Category } from '../models/api.models';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly apiPrefix = '/api/v1/categories';
  private readonly categoriesSubject = new BehaviorSubject<Category[]>([]);
  readonly categories$ = this.categoriesSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  getCategories(): Observable<Category[]> {
    return this.http
      .get<ApiResponse<{ categories: Category[] }>>(this.apiPrefix)
      .pipe(
        map((res) => this.pick(res.data?.categories, 'categories')),
        tap((categories) => this.categoriesSubject.next(categories)),
      );
  }

  getCategoryById(id: string): Observable<Category> {
    return this.http
      .get<ApiResponse<{ category: Category }>>(`${this.apiPrefix}/${id}`)
      .pipe(map((res) => this.pick(res.data?.category, 'category')));
  }

  createCategory(name: string, imageFile?: File): Observable<Category> {
    const formData = new FormData();
    formData.append('name', name);
    if (imageFile) {
      formData.append('image', imageFile);
    }
    return this.http
      .post<ApiResponse<{ category: Category }>>(this.apiPrefix, formData)
      .pipe(
        map((res) => this.pick(res.data?.category, 'category')),
        tap((category) => {
          const current = this.categoriesSubject.value;
          this.categoriesSubject.next([...current, category]);
        }),
      );
  }

  updateCategory(
    id: string,
    payload: { name?: string },
    imageFile?: File,
  ): Observable<Category> {
    const formData = new FormData();
    if (payload.name) {
      formData.append('name', payload.name);
    }
    if (imageFile) {
      formData.append('image', imageFile);
    }
    return this.http
      .patch<ApiResponse<{ category: Category }>>(`${this.apiPrefix}/${id}`, formData)
      .pipe(
        map((res) => this.pick(res.data?.category, 'category')),
        tap((category) => {
          const current = this.categoriesSubject.value;
          const updated = current.map((c) => (c._id === id ? category : c));
          this.categoriesSubject.next(updated);
        }),
      );
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiPrefix}/${id}`).pipe(
      tap(() => {
        const current = this.categoriesSubject.value;
        this.categoriesSubject.next(current.filter((c) => c._id !== id));
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

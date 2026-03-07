import { SHARED_IMPORTS } from '@app/shared/standalone-imports';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Category, Meal } from '../../../../core/models/api.models';
import { CategoryService } from '../../../../core/services/category.service';
import { MealService } from '../../../../core/services/meal.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-admin-meals-page',
  standalone: true,
  imports: SHARED_IMPORTS,
  templateUrl: './admin-meals-page.component.html',
  styleUrl: './admin-meals-page.component.scss',
})
export class AdminMealsPageComponent implements OnInit {
  protected meals: Meal[] = [];
  protected categories: Category[] = [];
  protected loading = true;
  protected busy = false;
  protected editingMealId: string | null = null;
  private imageFile?: File;

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    price: [0, [Validators.required, Validators.min(1)]],
    categoryId: ['', [Validators.required]],
    preparationTime: [10, [Validators.required, Validators.min(1)]],
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly mealService: MealService,
    private readonly categoryService: CategoryService,
    private readonly notificationService: NotificationService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadMeals();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.imageFile = input.files?.[0];
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const payload = {
      name: value.name,
      description: value.description,
      price: Number(value.price),
      categoryId: value.categoryId,
      preparationTime: Number(value.preparationTime),
    };

    if (!this.editingMealId && !this.imageFile) {
      this.notificationService.error('Meal image is required when creating.');
      return;
    }

    this.busy = true;
    const request$ = this.editingMealId
      ? this.mealService.updateMeal(this.editingMealId, payload, this.imageFile)
      : this.mealService.createMeal(payload, this.imageFile as File);

    request$.subscribe({
      next: () => {
        this.notificationService.success(
          this.editingMealId ? 'Meal updated.' : 'Meal created.',
        );
        this.resetForm();
        this.loadMeals();
      },
      error: () => {
        this.busy = false;
      },
      complete: () => {
        this.busy = false;
      },
    });
  }

  edit(meal: Meal): void {
    this.editingMealId = meal._id;
    this.form.patchValue({
      name: meal.name,
      description: meal.description,
      price: meal.price,
      categoryId: typeof meal.category === 'string' ? meal.category : meal.category._id,
      preparationTime: meal.preparationTime,
    });
  }

  cancelEdit(): void {
    this.resetForm();
  }

  deleteMeal(id: string): void {
    this.mealService.deleteMeal(id).subscribe({
      next: () => {
        this.notificationService.success('Meal deleted.');
        this.loadMeals();
      },
    });
  }

  private loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.cdr.detectChanges();
      },
    });
  }

  private loadMeals(): void {
    this.loading = true;
    this.mealService.getMeals().subscribe({
      next: (meals) => {
        this.meals = meals;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private resetForm(): void {
    this.editingMealId = null;
    this.imageFile = undefined;
    this.form.reset({
      name: '',
      description: '',
      price: 0,
      categoryId: '',
      preparationTime: 10,
    });
  }
}




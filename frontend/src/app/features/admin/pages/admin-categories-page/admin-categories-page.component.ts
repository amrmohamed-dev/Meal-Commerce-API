import { SHARED_IMPORTS } from '@app/shared/standalone-imports';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Category } from '../../../../core/models/api.models';
import { CategoryService } from '../../../../core/services/category.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-admin-categories-page',
  standalone: true,
  imports: SHARED_IMPORTS,
  templateUrl: './admin-categories-page.component.html',
  styleUrl: './admin-categories-page.component.scss',
})
export class AdminCategoriesPageComponent implements OnInit {
  protected categories: Category[] = [];
  protected loading = true;
  protected busy = false;
  protected editingCategoryId: string | null = null;
  private imageFile?: File;

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly categoryService: CategoryService,
    private readonly notificationService: NotificationService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadCategories();
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

    const name = this.form.getRawValue().name;
    this.busy = true;

    const request$ = this.editingCategoryId
      ? this.categoryService.updateCategory(this.editingCategoryId, { name }, this.imageFile)
      : this.categoryService.createCategory(name, this.imageFile);

    request$.subscribe({
      next: () => {
        this.notificationService.success(
          this.editingCategoryId
            ? 'Category updated.'
            : 'Category created.',
        );
        this.resetForm();
        this.loadCategories();
      },
      error: () => {
        this.busy = false;
      },
      complete: () => {
        this.busy = false;
      },
    });
  }

  edit(category: Category): void {
    this.editingCategoryId = category._id;
    this.form.patchValue({
      name: category.name,
    });
  }

  cancelEdit(): void {
    this.resetForm();
  }

  deleteCategory(id: string): void {
    this.categoryService.deleteCategory(id).subscribe({
      next: () => {
        this.notificationService.success('Category deleted.');
        this.loadCategories();
      },
    });
  }

  private resetForm(): void {
    this.editingCategoryId = null;
    this.imageFile = undefined;
    this.form.reset({ name: '' });
  }

  private loadCategories(): void {
    this.loading = true;
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }
}



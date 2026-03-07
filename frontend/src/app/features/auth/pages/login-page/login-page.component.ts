import { SHARED_IMPORTS } from '@app/shared/standalone-imports';
import { Component } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { extractErrorMessage } from '../../../../core/utils/http-error.util';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: SHARED_IMPORTS,
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
})
export class LoginPageComponent {
  protected loading = false;
  protected formError: string | null = null;
  protected readonly logoUrl =
    'https://res.cloudinary.com/dudarfssg/image/upload/v1772379053/meal-commerce_logo-removebg-preview_1_1_xly0hu.png';

  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly notificationService: NotificationService,
    private readonly router: Router,
  ) {}

  submit(): void {
    this.formError = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formError = 'Please correct the highlighted fields.';
      return;
    }

    this.loading = true;
    this.authService
      .login(this.form.getRawValue())
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
      )
      .subscribe({
        next: () => {
          this.notificationService.success('Welcome back.');
          this.router.navigate(['/meals']);
        },
        error: (error: HttpErrorResponse) => {
          this.formError = extractErrorMessage(error);
        },
      });
  }

  protected get email() {
    return this.form.controls.email;
  }

  protected get password() {
    return this.form.controls.password;
  }
}




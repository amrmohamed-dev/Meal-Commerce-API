import { SHARED_IMPORTS } from '@app/shared/standalone-imports';
import { Component } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AbstractControl,
  FormBuilder,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { extractErrorMessage } from '../../../../core/utils/http-error.util';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: SHARED_IMPORTS,
  templateUrl: './register-page.component.html',
  styleUrl: './register-page.component.scss',
})
export class RegisterPageComponent {
  protected loading = false;
  protected formError: string | null = null;
  protected readonly logoUrl =
    'https://res.cloudinary.com/dudarfssg/image/upload/v1772379053/meal-commerce_logo-removebg-preview_1_1_xly0hu.png';

  protected readonly form = this.formBuilder.nonNullable.group(
    {
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      passwordConfirm: ['', [Validators.required, Validators.minLength(8)]],
    },
    {
      validators: [passwordsMatchValidator()],
    },
  );

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
      this.formError = this.form.hasError('passwordMismatch')
        ? 'Passwords do not match.'
        : 'Please correct the highlighted fields.';
      return;
    }

    this.loading = true;
    this.authService.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.notificationService.success(
          'Account created. Verify your email to unlock all features.',
        );
        this.router.navigate(['/auth/verify-email']);
      },
      error: (error: HttpErrorResponse) => {
        this.formError = extractErrorMessage(error);
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  protected get name() {
    return this.form.controls.name;
  }

  protected get email() {
    return this.form.controls.email;
  }

  protected get password() {
    return this.form.controls.password;
  }

  protected get passwordConfirm() {
    return this.form.controls.passwordConfirm;
  }
}

function passwordsMatchValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password')?.value;
    const passwordConfirm = control.get('passwordConfirm')?.value;

    if (!password || !passwordConfirm) {
      return null;
    }

    return password === passwordConfirm ? null : { passwordMismatch: true };
  };
}




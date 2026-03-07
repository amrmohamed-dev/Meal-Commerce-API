import { SHARED_IMPORTS } from '@app/shared/standalone-imports';
import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { NotificationService } from '../../../../core/services/notification.service';
import { UserService } from '../../../../core/services/user.service';
import { extractErrorMessage } from '../../../../core/utils/http-error.util';

@Component({
  selector: 'app-update-password-page',
  standalone: true,
  imports: SHARED_IMPORTS,
  templateUrl: './update-password-page.component.html',
  styleUrl: './update-password-page.component.scss',
})
export class UpdatePasswordPageComponent {
  protected loading = false;
  protected formError: string | null = null;

  protected readonly form = this.formBuilder.nonNullable.group(
    {
      currentPassword: ['', [Validators.required, Validators.minLength(8)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      passwordConfirm: ['', [Validators.required, Validators.minLength(8)]],
    },
    {
      validators: [passwordsMatchValidator()],
    },
  );

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly userService: UserService,
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
    this.userService
      .updatePassword(this.form.getRawValue())
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
      )
      .subscribe({
        next: () => {
          this.notificationService.success('Password updated successfully.');
          this.router.navigate(['/profile']);
        },
        error: (error: HttpErrorResponse) => {
          this.formError = extractErrorMessage(error);
        },
      });
  }

  protected get currentPassword() {
    return this.form.controls.currentPassword;
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




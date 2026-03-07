import { SHARED_IMPORTS } from '@app/shared/standalone-imports';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { extractErrorMessage } from '../../../../core/utils/http-error.util';

@Component({
  selector: 'app-reset-password-page',
  standalone: true,
  imports: SHARED_IMPORTS,
  templateUrl: './reset-password-page.component.html',
  styleUrl: './reset-password-page.component.scss',
})
export class ResetPasswordPageComponent implements OnDestroy {
  protected sending = false;
  protected verifying = false;
  protected resetting = false;
  protected formError: string | null = null;
  protected resendCountdown = 0;
  protected readonly logoUrl =
    'https://res.cloudinary.com/dudarfssg/image/upload/v1772379053/meal-commerce_logo-removebg-preview_1_1_xly0hu.png';

  private countdownInterval?: ReturnType<typeof setInterval>;

  protected readonly form = this.formBuilder.nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email]],
      otp: ['', [Validators.required, Validators.minLength(6)]],
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

  sendOtp(): void {
    if (this.resendCountdown > 0) {
      return;
    }

    this.formError = null;
    const email = this.form.controls.email.value;
    if (!email) {
      this.form.controls.email.markAsTouched();
      this.formError = 'Enter your email first.';
      return;
    }

    this.sending = true;
    this.authService
      .sendOtp('Password Recovery', { email })
      .pipe(
        finalize(() => {
          this.sending = false;
        }),
      )
      .subscribe({
        next: () => {
          this.notificationService.success('If your account exists, an OTP was sent.');
          this.startCountdown();
        },
        error: (error: HttpErrorResponse) => {
          this.formError = extractErrorMessage(error);
        },
      });
  }

  verifyOtp(): void {
    this.formError = null;
    const { email, otp } = this.form.getRawValue();
    if (!email || !otp) {
      this.formError = 'Email and OTP are required.';
      return;
    }

    this.verifying = true;
    this.authService
      .verifyOtp('Password Recovery', { email, otp })
      .pipe(
        finalize(() => {
          this.verifying = false;
        }),
      )
      .subscribe({
        next: () => {
          this.notificationService.success('OTP verified.');
        },
        error: (error: HttpErrorResponse) => {
          this.formError = extractErrorMessage(error);
        },
      });
  }

  submit(): void {
    this.formError = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formError = this.form.hasError('passwordMismatch')
        ? 'Passwords do not match.'
        : 'Please correct the highlighted fields.';
      return;
    }

    this.resetting = true;
    this.authService
      .resetPassword(this.form.getRawValue())
      .pipe(
        finalize(() => {
          this.resetting = false;
        }),
      )
      .subscribe({
        next: () => {
          this.notificationService.success('Password reset successfully.');
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

  protected get otp() {
    return this.form.controls.otp;
  }

  protected get password() {
    return this.form.controls.password;
  }

  protected get passwordConfirm() {
    return this.form.controls.passwordConfirm;
  }

  protected get resendText(): string {
    if (this.resendCountdown === 0) {
      return 'Send OTP';
    }

    return `Resend in 00:${this.resendCountdown.toString().padStart(2, '0')}`;
  }

  private startCountdown(): void {
    this.clearCountdown();
    this.resendCountdown = 60;
    this.countdownInterval = setInterval(() => {
      this.resendCountdown -= 1;
      if (this.resendCountdown <= 0) {
        this.clearCountdown();
      }
    }, 1000);
  }

  private clearCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    this.countdownInterval = undefined;
    this.resendCountdown = 0;
  }

  ngOnDestroy(): void {
    this.clearCountdown();
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




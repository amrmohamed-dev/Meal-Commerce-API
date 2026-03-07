import { SHARED_IMPORTS } from '@app/shared/standalone-imports';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { extractErrorMessage } from '../../../../core/utils/http-error.util';

@Component({
  selector: 'app-verify-email-page',
  standalone: true,
  imports: SHARED_IMPORTS,
  templateUrl: './verify-email-page.component.html',
  styleUrl: './verify-email-page.component.scss',
})
export class VerifyEmailPageComponent implements OnDestroy {
  protected sending = false;
  protected verifying = false;
  protected formError: string | null = null;
  protected resendCountdown = 0;
  protected readonly logoUrl =
    'https://res.cloudinary.com/dudarfssg/image/upload/v1772379053/meal-commerce_logo-removebg-preview_1_1_xly0hu.png';

  private countdownInterval?: ReturnType<typeof setInterval>;

  protected readonly form = this.formBuilder.nonNullable.group({
    otp: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly notificationService: NotificationService,
    private readonly router: Router,
  ) {}

  sendCode(): void {
    if (this.resendCountdown > 0) {
      return;
    }

    this.formError = null;
    this.sending = true;
    this.authService.sendOtp('Email Confirmation').subscribe({
      next: () => {
        this.notificationService.success('If eligible, an OTP was sent to your email.');
        this.startCountdown();
      },
      error: (error: HttpErrorResponse) => {
        this.formError = extractErrorMessage(error);
        this.sending = false;
      },
      complete: () => {
        this.sending = false;
      },
    });
  }

  verify(): void {
    this.formError = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formError = 'Please enter a valid 6-digit OTP.';
      return;
    }

    this.verifying = true;
    this.authService.verifyEmail(this.form.getRawValue().otp).subscribe({
      next: () => {
        this.notificationService.success('Email verified successfully.');
        this.router.navigate(['/profile']);
      },
      error: (error: HttpErrorResponse) => {
        this.formError = extractErrorMessage(error);
        this.verifying = false;
      },
      complete: () => {
        this.verifying = false;
      },
    });
  }

  protected get otp() {
    return this.form.controls.otp;
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




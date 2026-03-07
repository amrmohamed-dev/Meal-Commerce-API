import { SHARED_IMPORTS } from '@app/shared/standalone-imports';
import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import {
  Observable,
  Subject,
  catchError,
  finalize,
  map,
  merge,
  of,
  shareReplay,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import { User } from '../../../../core/models/api.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { UserService } from '../../../../core/services/user.service';
import { extractErrorMessage } from '../../../../core/utils/http-error.util';

type LoadingState<T> = {
  loading: boolean;
  data: T;
};

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: SHARED_IMPORTS,
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss',
})
export class ProfilePageComponent {
  protected busy = false;
  protected photoBusy = false;
  protected formError: string | null = null;
  private readonly refreshProfile$ = new Subject<void>();
  private readonly profileUpdates$ = new Subject<User>();
  protected readonly profileState$: Observable<LoadingState<User | null>> =
    merge(
      this.refreshProfile$.pipe(
        startWith(void 0),
        switchMap(() =>
          this.userService.getMe().pipe(
            map((user) => ({ loading: false, data: user })),
            startWith({ loading: true, data: null }),
            catchError(() => {
              this.notificationService.warning(
                'Unable to load your profile right now. Please try again.',
              );
              return of({ loading: false, data: null });
            }),
          ),
        ),
      ),
      this.profileUpdates$.pipe(
        map((user) => ({ loading: false, data: user })),
      ),
    ).pipe(
      tap((state) => {
        if (!state.data) {
          return;
        }

        this.form.patchValue({
          name: state.data.name ?? '',
          phone: state.data.phone ?? '',
          street: state.data.address?.street ?? '',
          city: state.data.address?.city ?? '',
          notes: state.data.address?.notes ?? '',
        });
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    phone: [''],
    street: [''],
    city: [''],
    notes: [''],
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
  ) {}

  saveProfile(): void {
    this.formError = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formError = 'Please correct the highlighted fields.';
      return;
    }

    const value = this.form.getRawValue();
    this.busy = true;
    this.userService
      .updateMe({
        name: value.name,
        phone: value.phone,
        address: {
          street: value.street,
          city: value.city,
          notes: value.notes,
        },
      })
      .pipe(
        finalize(() => {
          this.busy = false;
        }),
      )
      .subscribe({
        next: (user) => {
          this.profileUpdates$.next(user);
          this.notificationService.success('Profile updated.');
        },
        error: (error: HttpErrorResponse) => {
          this.formError = extractErrorMessage(error);
        },
      });
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.photoBusy = true;
    this.userService
      .uploadProfilePhoto(file)
      .pipe(
        finalize(() => {
          input.value = '';
          this.photoBusy = false;
        }),
      )
      .subscribe({
        next: (user) => {
          this.profileUpdates$.next(user);
          this.notificationService.success('Profile photo updated.');
        },
        error: (error: HttpErrorResponse) => {
          this.formError = extractErrorMessage(error);
        },
      });
  }

  deletePhoto(): void {
    this.formError = null;
    this.photoBusy = true;
    this.userService
      .deleteProfilePhoto()
      .pipe(
        finalize(() => {
          this.photoBusy = false;
        }),
      )
      .subscribe({
        next: (user) => {
          this.profileUpdates$.next(user);
          this.notificationService.success('Profile photo deleted.');
        },
        error: (error: HttpErrorResponse) => {
          this.formError = extractErrorMessage(error);
        },
      });
  }

  protected get name() {
    return this.form.controls.name;
  }
}




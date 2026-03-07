import { SHARED_IMPORTS } from '@app/shared/standalone-imports';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { User } from '../../../../core/models/api.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { UserService } from '../../../../core/services/user.service';

@Component({
  selector: 'app-admin-users-page',
  standalone: true,
  imports: SHARED_IMPORTS,
  templateUrl: './admin-users-page.component.html',
  styleUrl: './admin-users-page.component.scss',
})
export class AdminUsersPageComponent implements OnInit {
  protected users: User[] = [];
  protected loading = true;
  protected busy = false;

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: ['user' as 'user' | 'admin'],
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  createUser(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.busy = true;
    const value = this.form.getRawValue();

    this.userService
      .createUser({
        name: value.name,
        email: value.email,
        password: value.password,
      })
      .subscribe({
        next: (createdUser) => {
          if (value.role === 'admin') {
            this.userService.updateUserRole(createdUser._id, 'admin').subscribe({
              next: () => {
                this.notificationService.success('User created.');
                this.form.reset({ role: 'user', name: '', email: '', password: '' });
                this.loadUsers();
              },
            });
          } else {
            this.notificationService.success('User created.');
            this.form.reset({ role: 'user', name: '', email: '', password: '' });
            this.loadUsers();
          }
        },
        error: () => {
          this.busy = false;
        },
        complete: () => {
          this.busy = false;
        },
      });
  }

  changeRole(user: User, role: 'user' | 'admin'): void {
    this.userService.updateUserRole(user._id, role).subscribe({
      next: () => {
        this.notificationService.success('Role updated.');
        this.loadUsers();
      },
    });
  }

  deleteUser(id: string): void {
    this.userService.deleteUser(id).subscribe({
      next: () => {
        this.notificationService.success('User deleted.');
        this.loadUsers();
      },
    });
  }

  private loadUsers(): void {
    this.loading = true;
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
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




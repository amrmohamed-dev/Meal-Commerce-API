import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  constructor(private readonly snackBar: MatSnackBar) {}

  success(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 2800,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['snack-success'],
    });
  }

  warning(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3600,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['snack-warning'],
    });
  }

  error(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 4200,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['snack-error'],
    });
  }
}

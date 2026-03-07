import { SHARED_IMPORTS } from '@app/shared/standalone-imports';
import { Component } from '@angular/core';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: SHARED_IMPORTS,
  template: `
    <section class="card-surface not-found">
      <h1>Page Not Found</h1>
      <p class="muted">The page you requested does not exist.</p>
      <a mat-flat-button class="brand-btn" routerLink="/">Back Home</a>
    </section>
  `,
  styles: [
    `
      .not-found {
        padding: 2rem;
        text-align: center;
        margin-top: 1.5rem;
      }
      h1 {
        margin: 0 0 0.5rem;
        color: #1f3a56;
      }
    `,
  ],
})
export class NotFoundPageComponent {}


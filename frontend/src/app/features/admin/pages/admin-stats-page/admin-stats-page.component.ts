import { SHARED_IMPORTS } from '@app/shared/standalone-imports';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { OrderStat } from '../../../../core/models/api.models';
import { OrderService } from '../../../../core/services/order.service';

@Component({
  selector: 'app-admin-stats-page',
  standalone: true,
  imports: SHARED_IMPORTS,
  templateUrl: './admin-stats-page.component.html',
  styleUrl: './admin-stats-page.component.scss',
})
export class AdminStatsPageComponent implements OnInit {
  protected loading = true;
  protected stats: OrderStat[] = [];

  constructor(
    private readonly orderService: OrderService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.orderService.getOrderStats().subscribe({
      next: (stats) => {
        this.stats = stats;
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




import { SHARED_IMPORTS } from '@app/shared/standalone-imports';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { OrderStat } from '../../../../core/models/api.models';
import { OrderService } from '../../../../core/services/order.service';

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: SHARED_IMPORTS,
  templateUrl: './admin-dashboard-page.component.html',
  styleUrl: './admin-dashboard-page.component.scss',
})
export class AdminDashboardPageComponent implements OnInit {
  protected loading = true;
  protected stats: OrderStat[] = [];
  protected totalOrders = 0;
  protected totalRevenue = 0;

  constructor(
    private readonly orderService: OrderService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.orderService.getOrderStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.totalOrders = stats.reduce((acc, item) => acc + item.nOrders, 0);
        this.totalRevenue = stats.reduce((acc, item) => acc + item.totalRevenue, 0);
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




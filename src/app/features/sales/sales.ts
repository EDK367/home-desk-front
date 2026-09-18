import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../shared/components/layout/sidebar/sidebar.component';
import { NotificationService } from '../../core/services/notification';
import { Subscription } from 'rxjs';

interface ToastState {
  show: boolean;
  type: 'success' | 'error';
  title: string;
  message: string;
}

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, CommonModule],
  templateUrl: './sales.html',
  styleUrl: './sales.css',
})
export class Sales implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  private toastSub: Subscription | null = null;
  private toastTimeout: any = null;

  toast: ToastState | null = null;

  ngOnInit(): void {
    this.toastSub = this.notificationService.toast$.subscribe(t => {
      if (this.toastTimeout) clearTimeout(this.toastTimeout);
      this.toast = {
        show: true,
        type: t.type === 'error' ? 'error' : 'success',
        title: t.title,
        message: t.message
      };
      this.cdr.detectChanges();
      this.toastTimeout = setTimeout(() => this.closeToast(), 5000);
    });
  }

  ngOnDestroy(): void {
    this.toastSub?.unsubscribe();
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
  }

  closeToast(): void {
    if (this.toast) {
      this.toast.show = false;
      this.toast = null;
      this.cdr.detectChanges();
    }
  }
}

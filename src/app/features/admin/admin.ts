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
  selector: 'app-admin',
  imports: [RouterOutlet, SidebarComponent, CommonModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})

// implementacion de OnInit y OnDestroy para cargar datos
export class Admin implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  private toastSub: Subscription | null = null;
  private toastTimeout: any = null;

  toast: ToastState | null = null;

  // incializacion de los mensajes
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

  // para actualizar los datos de manera pidiendo una consulta
  ngOnDestroy(): void {
    this.toastSub?.unsubscribe();
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
  }

  // mensajes
  closeToast(): void {
    if (this.toast) {
      this.toast.show = false;
      this.toast = null;
      this.cdr.detectChanges();
    }
  }
}


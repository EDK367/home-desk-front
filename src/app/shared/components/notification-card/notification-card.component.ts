import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { WebSocketService } from '../../../core/services/websocket';
import { WsNotification } from '../../../core/models/websocket';

@Component({
  selector: 'app-notification-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-card.component.html',
  styleUrl: './notification-card.component.css'
})
export class NotificationCardComponent implements OnInit, OnDestroy {
  private wsService = inject(WebSocketService);
  private sub: Subscription | null = null;
  private timeouts = new Map<string, any>();

  notifications = signal<WsNotification[]>([]);

  ngOnInit(): void {
    this.sub = this.wsService.notifications$.subscribe(notif => {
      this.notifications.update(current => [notif, ...current.slice(0, 3)]);

      const timeoutId = setTimeout(() => {
        this.dismiss(notif.id);
      }, 6000);

      this.timeouts.set(notif.id, timeoutId);
    });
  }

  dismiss(id: string): void {
    const timeoutId = this.timeouts.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timeouts.delete(id);
    }
    this.notifications.update(current => current.filter(n => n.id !== id));
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.timeouts.forEach(t => clearTimeout(t));
    this.timeouts.clear();
  }
}

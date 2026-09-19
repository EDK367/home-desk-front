import { Injectable, OnDestroy } from '@angular/core';
import { Subject, BehaviorSubject, Observable } from 'rxjs';
import { Client, IMessage } from '@stomp/stompjs';
import { environment } from '../../../environments/environment';
import {
  WsNotification,
  LowStockPayload,
  NewPurchasePayload,
  NewSalePayload,
  NewPaymentPayload,
  AuditLogPayload
} from '../models/websocket';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
  private client: Client | null = null;
  private notificationSubject = new Subject<WsNotification>();
  private connectedSubject = new BehaviorSubject<boolean>(false);

  notifications$: Observable<WsNotification> = this.notificationSubject.asObservable();
  connected$: Observable<boolean> = this.connectedSubject.asObservable();

  constructor() {
    this.connect();
  }

  connect(): void {
    const wsUrl = environment.wsUrl;

    this.client = new Client({
      brokerURL: wsUrl,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        this.connectedSubject.next(true);
        this.subscribeTopics();
      },
      onDisconnect: () => {
        this.connectedSubject.next(false);
      },
      onStompError: () => {
        this.connectedSubject.next(false);
      }
    });

    this.client.activate();
  }

  private subscribeTopics(): void {
    if (!this.client || !this.client.connected) {
      return;
    }

    this.client.subscribe('/topic/low-stock', (msg: IMessage) => {
      try {
        const data: LowStockPayload = JSON.parse(msg.body);
        this.emitNotification({
          id: this.generateId(),
          type: 'low-stock',
          title: 'Stock bajo',
          message: data.message || (data.productName ? `${data.productName} tiene stock bajo` : 'Stock bajo detectado'),
          timestamp: new Date(),
          rawPayload: data
        });
      } catch (e) {}
    });

    this.client.subscribe('/topic/purchases', (msg: IMessage) => {
      try {
        const data: NewPurchasePayload = JSON.parse(msg.body);
        this.emitNotification({
          id: this.generateId(),
          type: 'purchase',
          title: 'Nueva compra',
          message: data.message || `Se registró una nueva compra #${data.purchaseId ?? ''}`,
          timestamp: new Date(),
          rawPayload: data
        });
      } catch (e) {}
    });

    this.client.subscribe('/topic/sales', (msg: IMessage) => {
      try {
        const data: NewSalePayload = JSON.parse(msg.body);
        this.emitNotification({
          id: this.generateId(),
          type: 'sale',
          title: 'Nueva venta',
          message: data.message || `Se registró la venta ${data.invoiceNumber ?? ''}`,
          timestamp: new Date(),
          rawPayload: data
        });
      } catch (e) {}
    });

    this.client.subscribe('/topic/sale-payments', (msg: IMessage) => {
      try {
        const data: NewPaymentPayload = JSON.parse(msg.body);
        this.emitNotification({
          id: this.generateId(),
          type: 'payment',
          title: 'Nuevo pago',
          message: data.message || `Se recibió un pago de Q${data.amount ?? ''}`,
          timestamp: new Date(),
          rawPayload: data
        });
      } catch (e) {}
    });

    this.client.subscribe('/topic/audit-logs', (msg: IMessage) => {
      try {
        const data: AuditLogPayload = JSON.parse(msg.body);
        this.emitNotification({
          id: this.generateId(),
          type: 'audit',
          title: 'Actividad',
          message: data.message || `${data.username || 'Usuario'} ${data.description || data.action || ''}`,
          timestamp: new Date(),
          rawPayload: data
        });
      } catch (e) {}
    });
  }

  private emitNotification(notification: WsNotification): void {
    this.notificationSubject.next(notification);
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  }

  disconnect(): void {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.connectedSubject.next(false);
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}

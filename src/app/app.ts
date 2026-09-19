import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationCardComponent } from './shared/components/notification-card/notification-card.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NotificationCardComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('home-desk-front');
}

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../shared/components/layout/sidebar/sidebar.component';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css',
})
export class Inventory {}

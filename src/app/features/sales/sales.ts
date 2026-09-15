import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../shared/components/layout/sidebar/sidebar.component';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './sales.html',
  styleUrl: './sales.css',
})
export class Sales {}

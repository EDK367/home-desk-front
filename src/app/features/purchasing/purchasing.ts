import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../shared/components/layout/sidebar/sidebar.component';

@Component({
  selector: 'app-purchasing',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './purchasing.html',
  styleUrl: './purchasing.css',
})
export class Purchasing {}

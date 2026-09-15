import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../shared/components/layout/sidebar/sidebar.component';

@Component({
  selector: 'app-admin',
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin { }

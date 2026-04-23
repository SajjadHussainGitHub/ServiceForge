import { Component, EventEmitter, Input, Output } from '@angular/core';

export type DashboardMenu =
  | 'maintenance'
  | 'overview'
  | 'settings'
  | 'sla'
  | 'enquiry'
  | 'orderLeads'
  | 'existingContractRenewal'
  | 'paymentMethod'
  | 'installmentsAdd'
  | 'installmentsView';

@Component({
  selector: 'app-sidebar',
  imports: [],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  @Input() isAdmin = false;
  @Input() isCollapsed = false;
  @Output() menuSelect = new EventEmitter<DashboardMenu>();
}

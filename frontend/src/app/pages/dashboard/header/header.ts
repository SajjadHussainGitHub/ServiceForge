import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  @Input() isSidebarCollapsed = false;
  @Input() displayName = 'Sajjad Admin';
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() goOverview = new EventEmitter<void>();
  @Output() signOut = new EventEmitter<void>();

  get initials(): string {
    const trimmed = this.displayName.trim();
    if (!trimmed) {
      return 'SF';
    }
    const parts = trimmed.split(/\s+/).slice(0, 2);
    return parts
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }
}

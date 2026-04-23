import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from '../../core/auth/auth.service';
import { routes } from '../../app.routes';
import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let fixture: ComponentFixture<Dashboard>;
  let auth: { logout: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    auth = { logout: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter(routes),
        { provide: AuthService, useValue: auth as unknown as AuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should call logout when sign out is clicked', () => {
    fixture.componentInstance.signOut();
    expect(auth.logout).toHaveBeenCalled();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from '../../core/auth/auth.service';
import { routes } from '../../app.routes';
import { Login } from './login';

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let auth: { login: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    auth = { login: vi.fn().mockReturnValue(of({ token: 't' })) };
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter(routes),
        { provide: AuthService, useValue: auth as unknown as AuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should call auth.login when form is valid', () => {
    const login = fixture.componentInstance;
    login.form.setValue({
      email: 'user@example.com',
      password: 'secret',
      rememberMe: false,
    });
    login.onSubmit();
    expect(auth.login).toHaveBeenCalledTimes(1);
  });
});

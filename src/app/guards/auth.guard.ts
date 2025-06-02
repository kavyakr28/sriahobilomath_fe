import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
     // Check if user is authenticated
     if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: state.url } 
      });
      return false;
    }

    // Check if route is restricted by role
    const requiredRole = route.data['role'] as string;
    if (requiredRole) {
      const hasRequiredRole = this.authService.hasRole(requiredRole);
      
      // if (!hasRequiredRole) {
      //   // Role not authorized, redirect to access-denied
      //   this.router.navigate(['/access-denied']);
      //   return false;
      // }
    }

    return true;
  }
}

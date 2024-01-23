import { Injectable } from '@angular/core';
import { Router, UrlTree } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class RedirectService {
  constructor(private router: Router) {}
  private _redirectRoute = '/flows';
  get redirectRoute() {
    return this._redirectRoute;
  }
  setRedirectRouteToCurrentRoute() {
    const currentURL = window.location.href;
    const route = currentURL.replace(window.location.origin, '');
    this._redirectRoute = route || '/flows';
    console.log(route);
  }

  redirect() {
    const urlTree: UrlTree = this.router.parseUrl(this._redirectRoute);
    this.router.navigateByUrl(urlTree);
    this._redirectRoute = '/flows';
  }
}

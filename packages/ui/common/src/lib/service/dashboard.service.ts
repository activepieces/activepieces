import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private hideSideNavRoutes$: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );

  hideSideNavRoutes() {
    this.hideSideNavRoutes$.next(true);
  }
  showSideNavRoutes() {
    this.hideSideNavRoutes$.next(false);
  }
  gethideSideNaveRoutesObs() {
    return this.hideSideNavRoutes$.asObservable();
  }
}

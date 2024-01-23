import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private isInPlatformRoute$: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );

  enteredPlatformModule() {
    this.isInPlatformRoute$.next(true);
  }
  leftPlatformModule() {
    this.isInPlatformRoute$.next(false);
  }
  getIsInPlatformRoute() {
    return this.isInPlatformRoute$.asObservable();
  }
}

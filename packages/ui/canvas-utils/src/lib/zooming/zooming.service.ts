import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ZoomingService {
  private _zoomingScale$: BehaviorSubject<number> = new BehaviorSubject(1);
  readonly zoomingStep = 0.25;
  readonly maxZoom = 1.25;
  readonly minZoom = 0.5;

  get zoomingScale$() {
    return this._zoomingScale$.asObservable();
  }
  get zoomingScale() {
    return this._zoomingScale$.value;
  }
  setZoomingScale(scale: number) {
    this._zoomingScale$.next(scale);
  }
}

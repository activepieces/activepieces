import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ZoomingService {
  private _zoomingScale$: BehaviorSubject<number> = new BehaviorSubject(1);
  readonly zoomingStep = 0.25;
  readonly zoomingMax = 1.25;
  private _zoomingMin = 0.5;
  get zoomingMin() {
    return this._zoomingMin;
  }
  set zoomingMin(value: number) {
    this._zoomingMin = value;
  }
  get zoomingScale$() {
    return this._zoomingScale$.asObservable();
  }
  get zoomingScale() {
    return this._zoomingScale$.value;
  }
  setZoomingScale(scale: number) {
    this._zoomingScale$.next(
      Math.max(this.zoomingMin, Math.min(this.zoomingMax, scale))
    );
  }
}

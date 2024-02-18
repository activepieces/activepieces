import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ZoomingService {
  private _zoomingScale$: BehaviorSubject<number> = new BehaviorSubject(1);
  readonly zoomingStep = 0.25;
  readonly maxZoom = 1.25;
  readonly ZOOMING_ANIMATION = '400ms';
  private _minZoom = 0.5;
  private readonly MIN_ZOOM_CONST = 0.5;
  get zoomingScale$() {
    return this._zoomingScale$.asObservable();
  }
  get zoomingScale() {
    return this._zoomingScale$.value;
  }
  //TODO: adjust the panning offsets to center zooming in the middle of canvas not flow
  setZoomingScale(scale: number) {
    this._zoomingScale$.next(scale);
  }
  get minZoom() {
    return this._minZoom;
  }
  set minZoom(minZoom: number) {
    this._minZoom = Math.min(minZoom, this.MIN_ZOOM_CONST);
  }
}

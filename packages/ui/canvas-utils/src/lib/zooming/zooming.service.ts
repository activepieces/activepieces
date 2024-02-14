import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ZoomingService {
  zoomingScale$: BehaviorSubject<number> = new BehaviorSubject(1);
  readonly zoomingStep = 0.25;
  readonly zoomingMax = 1.25;
  private _zoomingMin = 0.5;
  get zoomingMin() {
    return this._zoomingMin;
  }
  set zoomingMin(value: number) {
    this._zoomingMin = value;
  }
}

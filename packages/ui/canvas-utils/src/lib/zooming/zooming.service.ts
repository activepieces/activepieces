import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ZoomingService {
  zoomingScale$: BehaviorSubject<number> = new BehaviorSubject(1);
  readonly zoomingStep = 0.25;
  readonly zoomingMax = 1.75;
  readonly zoomingMin = 0.25;
}

import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ZoomingService {
  zoomingScale$: Subject<number> = new Subject();
}

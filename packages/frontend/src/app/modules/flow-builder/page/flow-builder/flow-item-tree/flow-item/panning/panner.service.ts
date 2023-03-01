import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PannerService {
  panningOffset$: Subject<{ x: number; y: number }> = new Subject();
}

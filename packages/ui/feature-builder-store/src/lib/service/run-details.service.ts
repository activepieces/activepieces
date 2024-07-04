import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RunDetailsService {
  hideAllIterationsInput$: Subject<boolean> = new Subject();
}

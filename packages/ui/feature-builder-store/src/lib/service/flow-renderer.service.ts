import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FlowRendererService {
  clientMouseX = 0;
  clientMouseY = 0;
  readonly INVALID_DROP_MESSAGE = $localize`Can't Move here`;
  draggingSubject = new BehaviorSubject<boolean>(false);
}

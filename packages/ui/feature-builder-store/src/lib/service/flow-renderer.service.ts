import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FlowRendererService {
  clientMouseX = 0;
  clientMouseY = 0;
  readonly INVALID_DROP_MESSAGE = $localize`Can't Move here`;
  private draggingStepSubject = new BehaviorSubject<boolean>(false);
  get isDragginStep$() {
    return this.draggingStepSubject.asObservable();
  }
  setIsDraggingStep(isDragging: boolean) {
    this.draggingStepSubject.next(isDragging);
  }
  get isDraggingStateSnapshot() {
    return this.draggingStepSubject.value;
  }
}

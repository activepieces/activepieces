import { CdkDragMove } from '@angular/cdk/drag-drop';
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { TestStepService } from '../../service/test-step.service';

@Component({
  selector: 'app-horizontal-sidebar-separator',
  templateUrl: './horizontal-sidebar-separator.component.html',
  styleUrls: ['./horizontal-sidebar-separator.component.scss'],
})
export class HorizontalSidebarSeparatorComponent implements OnDestroy {
  animate = false;
  resizerKnobIsBeingDragged = false;
  @Input() resizerArea: HTMLElement;
  @Input() topStyle = 'calc(50% - 5px)';
  @Output() resizerDragged: EventEmitter<CdkDragMove> = new EventEmitter();
  @Output() resizerDragStarted = new EventEmitter();
  @Output() resizerDragStopped = new EventEmitter();
  @Output() resetTopResizerSectionHeight = new EventEmitter();
  dragPosition = { x: 0, y: 0 };
  elevateResizer$: Observable<void>;
  constructor(private testStepService: TestStepService) {
    this.elevateResizer$ = this.testStepService.elevateResizer$.pipe(
      tap((shouldAnimate) => {
        if (shouldAnimate) {
          this.dragPosition = { x: 0, y: 0 };
          this.topStyle = 'calc(50% + 17px)';
          setTimeout(() => {
            this.animate = false;
          }, 150);
        }
      }),
      map(() => void 0)
    );
  }

  resizerIsBeingDragged(dragMoveEvent: CdkDragMove) {
    this.resizerDragged.next(dragMoveEvent);
  }
  ngOnDestroy(): void {
    this.resetTopResizerSectionHeight.emit();
  }
}

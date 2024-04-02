import { CdkDragMove } from '@angular/cdk/drag-drop';
import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { TestStepService } from '../../service/test-step.service';

@Component({
  selector: 'ap-horizontal-sidebar-separator',
  templateUrl: './horizontal-sidebar-separator.component.html',
  styleUrls: ['./horizontal-sidebar-separator.component.scss'],
})
export class HorizontalSidebarSeparatorComponent implements OnDestroy, OnInit {
  animate = false;
  resizerKnobIsBeingDragged = false;
  @Input() resizerArea: HTMLElement;
  @Input({ required: true }) topStyle = 'calc(50% + 5px)';
  @Output() resizerDragged: EventEmitter<CdkDragMove> = new EventEmitter();
  @Output() resizerDragStarted = new EventEmitter();
  @Output() resizerDragStopped = new EventEmitter();
  @Output() resetTopResizerSectionHeight = new EventEmitter();
  @Input({ required: true }) elevateResizerOnTestingStep = false;
  initialTopStyle = '';
  isResizerGrabbed = false;
  dragPosition = { x: 0, y: 0 };
  elevateResizer$: Observable<void>;
  constructor(private testStepService: TestStepService) {}
  ngOnInit(): void {
    this.initialTopStyle = this.topStyle;
    if (this.elevateResizerOnTestingStep) {
      this.elevateResizer$ = this.testStepService.elevateResizer$.pipe(
        tap((shouldAnimate) => {
          if (shouldAnimate && !this.isResizerGrabbed) {
            this.dragPosition = { x: 0, y: 0 };
            this.topStyle = 'calc(50% - 100px)';
            setTimeout(() => {
              this.animate = false;
            }, 150);
          }
        }),
        map(() => void 0)
      );
    }
  }

  resizerIsBeingDragged(dragMoveEvent: CdkDragMove) {
    this.resizerDragged.next(dragMoveEvent);
  }
  ngOnDestroy(): void {
    this.resetTopResizerSectionHeight.emit();
  }
  @HostListener('window:resize', ['$event'])
  onResize() {
    this.topStyle = this.initialTopStyle;
    this.dragPosition = { x: 0, y: 0 };
  }
}

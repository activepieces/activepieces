import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import {
  FlowItem,
  FlowRendererService,
  DROP_ZONE_HEIGHT,
  DROP_ZONE_WIDTH,
} from '@activepieces/ui/feature-builder-store';
import { Observable } from 'rxjs';
import { DropEvent } from 'angular-draggable-droppable';

@Component({
  selector: 'app-drop-zone',
  templateUrl: './drop-zone.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DropZoneComponent {
  readonly DROP_ZONE_WIDTH = DROP_ZONE_WIDTH;
  readonly DROP_ZONE_HEIGHT = DROP_ZONE_HEIGHT;
  @Input() containerClass = '';
  @Input() top = '';
  @Input() left = '';
  @Output() dragEnter = new EventEmitter<boolean>();
  @Output() dragLeave = new EventEmitter<boolean>();
  @Output() dropped = new EventEmitter<DropEvent<FlowItem>>();
  showDropArea$: Observable<boolean>;
  constructor(private flowRendererService: FlowRendererService) {
    this.showDropArea$ =
      this.flowRendererService.draggingSubject.asObservable();
  }
}

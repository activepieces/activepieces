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
} from '@activepieces/ui/feature-builder-store';
import { Observable } from 'rxjs';
import { DropEvent } from 'angular-draggable-droppable';

@Component({
  selector: 'app-drop-zone',
  templateUrl: './drop-zone.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DropZoneComponent {
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

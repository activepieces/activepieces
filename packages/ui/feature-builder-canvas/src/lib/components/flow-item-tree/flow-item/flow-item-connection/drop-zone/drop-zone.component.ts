import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { Observable } from 'rxjs';
import { DropEvent } from 'angular-draggable-droppable';

import { Action } from '@activepieces/shared';
import {
  DROP_ZONE_HEIGHT,
  DROP_ZONE_WIDTH,
} from '@activepieces/ui-canvas-utils';
import { FlowRendererService } from '@activepieces/ui/common';

@Component({
  selector: 'app-drop-zone',
  templateUrl: './drop-zone.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DropZoneComponent implements OnInit {
  readonly DROP_ZONE_WIDTH = DROP_ZONE_WIDTH;
  readonly DROP_ZONE_HEIGHT = DROP_ZONE_HEIGHT;
  top = '';
  left = '';
  @Input() containerClass = '';
  @Input({ required: true }) btnTop = 0;
  @Input({ required: true }) btnLeft = 0;
  @Input({ required: true }) btnWidth = 0;
  @Input({ required: true }) btnHeight = 0;
  @Output() dragEnter = new EventEmitter<boolean>();
  @Output() dragLeave = new EventEmitter<boolean>();
  @Output() dropped = new EventEmitter<DropEvent<{ content: Action }>>();
  showDropArea$: Observable<boolean>;
  constructor(private flowRendererService: FlowRendererService) {
    this.showDropArea$ = this.flowRendererService.isDragginStep$;
  }
  ngOnInit() {
    this.top = `${this.btnTop - DROP_ZONE_HEIGHT / 2 + this.btnHeight / 2}px`;
    this.left = `${this.btnLeft - DROP_ZONE_WIDTH / 2 + +this.btnWidth / 2}px`;
  }
}

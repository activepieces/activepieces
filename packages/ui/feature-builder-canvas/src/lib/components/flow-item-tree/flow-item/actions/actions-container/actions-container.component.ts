import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BuilderSelectors, Step } from '@activepieces/ui/feature-builder-store';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { FlowRendererService } from '@activepieces/ui/common';
import { ACTION_BUTTON_DIMENSION } from '../common';

@Component({
  selector: 'app-actions-container',
  templateUrl: './actions-container.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionsContainerComponent {
  @Input() trigger: boolean;
  @Input() flowItem: Step;
  @Input() stepHovered: boolean;
  isDragging$: Observable<boolean>;
  readonly$: Observable<boolean>;
  readonly ACTION_BUTTON_DIMENSION = ACTION_BUTTON_DIMENSION;
  constructor(
    private store: Store,
    private flowRendererService: FlowRendererService
  ) {
    this.isDragging$ = this.flowRendererService.isDragginStep$;
    this.readonly$ = this.store.select(BuilderSelectors.selectReadOnly);
  }
}

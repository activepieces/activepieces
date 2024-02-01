import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  BuilderSelectors,
  Step,
  FlowRendererService,
} from '@activepieces/ui/feature-builder-store';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

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
  replaceTriggerIsActive$: Observable<boolean>;
  constructor(
    private store: Store,
    private flowRendererService: FlowRendererService
  ) {
    this.replaceTriggerIsActive$ = this.store.select(
      BuilderSelectors.selectReplaceTriggerIsActive
    );
    this.isDragging$ = this.flowRendererService.isDragginStep$;
    this.readonly$ = this.store.select(BuilderSelectors.selectReadOnly);
  }
}

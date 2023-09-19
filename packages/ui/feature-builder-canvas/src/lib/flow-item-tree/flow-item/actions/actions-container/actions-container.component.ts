import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  BuilderSelectors,
  FlowItem,
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
  @Input() flowItem: FlowItem;
  @Input() stepHovered: boolean;
  isDragging$: Observable<boolean>;
  readonly$: Observable<boolean>;
  constructor(
    private store: Store,
    private flowRendererService: FlowRendererService
  ) {
    this.isDragging$ = this.flowRendererService.draggingSubject.asObservable();
    this.readonly$ = this.store.select(BuilderSelectors.selectReadOnly);
  }
}

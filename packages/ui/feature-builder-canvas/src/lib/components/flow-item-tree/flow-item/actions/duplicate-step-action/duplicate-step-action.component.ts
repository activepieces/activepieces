import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  BuilderSelectors,
  Step,
  FlowsActions,
} from '@activepieces/ui/feature-builder-store';
import { Observable, forkJoin, map, switchMap, take, tap } from 'rxjs';
import { FlowVersion, flowHelper } from '@activepieces/shared';
import { Store } from '@ngrx/store';
import { FlowService } from '@activepieces/ui/common';
import { ACTION_BUTTON_ICON_DIMENSION } from '../common';
@Component({
  selector: 'app-duplicate-step-action',
  templateUrl: './duplicate-step-action.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuplicateStepActionComponent {
  @Input({ required: true })
  flowItem: Step;
  duplicate$: Observable<void> | undefined;
  readonly ACTION_BUTTON_ICON_DIMENSION = ACTION_BUTTON_ICON_DIMENSION;
  constructor(private store: Store, private flowService: FlowService) {}
  duplicateStep() {
    const flowVersionWithArtifacts$ = this.getFlowVersionWithArtifacts();
    this.duplicate$ = flowVersionWithArtifacts$.pipe(
      tap((flowVersionWithArtifacts) => {
        if (this.flowItem && flowHelper.isAction(this.flowItem.type)) {
          this.store.dispatch(
            FlowsActions.duplicateStep({
              operation: {
                flowVersionWithArtifacts: flowVersionWithArtifacts,
                originalStepName: this.flowItem.name,
              },
            })
          );
        }
      }),
      map(() => void 0)
    );
  }
  private getFlowVersionWithArtifacts(): Observable<FlowVersion> {
    const currentFlow = this.store
      .select(BuilderSelectors.selectCurrentFlow)
      .pipe(take(1));
    const currentFlowVersionId = this.store
      .select(BuilderSelectors.selectDraftVersionId)
      .pipe(take(1));
    const flowVersion$: Observable<FlowVersion> = forkJoin({
      currentFlowVersionId,
      currentFlow,
    }).pipe(
      switchMap((res) => {
        return this.flowService.get(
          res.currentFlow.id,
          res.currentFlowVersionId
        );
      }),
      map((flow) => {
        return flow.version;
      })
    );
    return flowVersion$;
  }
}

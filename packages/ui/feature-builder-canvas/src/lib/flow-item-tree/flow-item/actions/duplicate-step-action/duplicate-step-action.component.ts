import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  BuilderSelectors,
  FlowItem,
  FlowsActions,
} from '@activepieces/ui/feature-builder-store';
import { Observable, forkJoin, map, switchMap, take, tap } from 'rxjs';
import { ActionType, FlowVersion, FlowViewMode } from '@activepieces/shared';
import { Store } from '@ngrx/store';
import { FlowService } from '@activepieces/ui/common';
@Component({
  selector: 'app-duplicate-step-action',
  templateUrl: './duplicate-step-action.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuplicateStepActionComponent {
  @Input({ required: true })
  flowItem: FlowItem;
  duplicate$: Observable<void> | undefined;
  constructor(private store: Store, private flowService: FlowService) {}
  duplicateStep() {
    const flowVersionWithArtifacts$ = this.getFlowVersionWithArtifacts();
    this.duplicate$ = flowVersionWithArtifacts$.pipe(
      tap((flowVersionWithArtifacts) => {
        if (
          this.flowItem &&
          (this.flowItem.type === ActionType.CODE ||
            this.flowItem.type === ActionType.PIECE ||
            this.flowItem.type === ActionType.BRANCH ||
            this.flowItem.type === ActionType.LOOP_ON_ITEMS)
        ) {
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
      .select(BuilderSelectors.selectCurrentFlowVersionId)
      .pipe(take(1));
    const flowVersion$: Observable<FlowVersion> = forkJoin({
      currentFlowVersionId,
      currentFlow,
    }).pipe(
      switchMap((res) => {
        return this.flowService.get(
          res.currentFlow.id,
          res.currentFlowVersionId,
          FlowViewMode.WITH_ARTIFACTS
        );
      }),
      map((flow) => {
        return flow.version;
      })
    );
    return flowVersion$;
  }
}

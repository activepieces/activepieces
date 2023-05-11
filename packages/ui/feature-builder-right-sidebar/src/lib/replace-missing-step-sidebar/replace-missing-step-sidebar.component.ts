import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  BuilderSelectors,
  CodeService,
  FlowItem,
  FlowsActions,
  NO_PROPS,
  RightSideBarType,
} from '@activepieces/ui/feature-builder-store';
import { Store } from '@ngrx/store';
import { Observable, take, tap } from 'rxjs';
import { FlowItemDetails } from '@activepieces/ui/common';
import { constructUpdateOperation } from '../step-type-sidebar/step-type-list/utils';

@Component({
  selector: 'app-replace-missing-step-sidebar',
  templateUrl: './replace-missing-step-sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplaceMissingStepSidebarComponent {
  flowItemDetailsLoaded$: Observable<boolean>;
  replaceEmptyStep$: Observable<FlowItem | undefined>;
  recommendedFlowItemDetails$: Observable<FlowItemDetails[]>;
  constructor(private store: Store, private codeService: CodeService) {
    this.recommendedFlowItemDetails$ = this.store.select(
      BuilderSelectors.selectMissingStepRecommendedFlowItemsDetails
    );
    this.flowItemDetailsLoaded$ = this.store.select(
      BuilderSelectors.selectAllFlowItemsDetailsLoadedState
    );
  }
  closeSidebar() {
    this.store.dispatch(
      FlowsActions.setRightSidebar({
        sidebarType: RightSideBarType.NONE,
        props: NO_PROPS,
        deselectCurrentStep: true,
      })
    );
  }
  showOtherApps() {
    this.store.dispatch(
      FlowsActions.setRightSidebar({
        sidebarType: RightSideBarType.STEP_TYPE,
        props: NO_PROPS,
        deselectCurrentStep: false,
      })
    );
  }
  replaceMissingStep(flowItemDetails: FlowItemDetails) {
    this.replaceEmptyStep$ = this.store
      .select(BuilderSelectors.selectCurrentStep)
      .pipe(
        take(1),
        tap((res) => {
          const operation = constructUpdateOperation(
            flowItemDetails,
            res?.name || '',
            res?.displayName || '',
            this.codeService.helloWorldBase64()
          );
          this.store.dispatch(
            FlowsActions.updateAction({
              operation: operation,
              updatingMissingStep: true,
            })
          );
        })
      );
  }
}

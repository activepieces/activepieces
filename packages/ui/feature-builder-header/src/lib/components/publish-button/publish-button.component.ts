import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, map, Observable, of } from 'rxjs';
import {
  BuilderSelectors,
  ViewModeEnum,
  ViewModeActions,
  FlowsActions,
} from '@activepieces/ui/feature-builder-store';

@Component({
  selector: 'app-publish-button',
  templateUrl: './publish-button.component.html',
  styleUrls: ['./publish-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublishButtonComponent implements OnInit {
  flowState$: Observable<{
    isSaving: boolean;
    isPublishing: boolean;
    isCurrentFlowVersionPublished: boolean;
    isShowingPublishedVersion: boolean;
  }>;
  isDeployingOrIsSaving$: Observable<boolean>;
  deploying$: Observable<boolean> = of(false);
  disablePublishButton$: Observable<boolean>;
  buttonTooltipText$: Observable<string>;
  publishBtnText$: Observable<string>;
  isCurrentFlowVersionPublished$: Observable<boolean>;
  dispatchAction$: Observable<void>;
  viewMode$: Observable<ViewModeEnum>;
  ViewModeEnum = ViewModeEnum;
  constructor(private store: Store) {
    this.viewMode$ = this.store.select(BuilderSelectors.selectViewMode);
  }

  ngOnInit(): void {
    this.setFlowStateListener();
  }

  private setFlowStateListener() {
    this.isCurrentFlowVersionPublished$ = this.store.select(
      BuilderSelectors.selectIsCurrentVersionPublished
    );
    this.flowState$ = combineLatest({
      isSaving: this.store.select(BuilderSelectors.selectIsSaving),
      isPublishing: this.store.select(BuilderSelectors.selectIsPublishing),
      isCurrentFlowVersionPublished: this.isCurrentFlowVersionPublished$,
      isShowingPublishedVersion: this.store.select(
        BuilderSelectors.selectIsInPublishedVersionViewMode
      ),
    });
    this.disablePublishButton$ = combineLatest({
      publishingSavingStates: this.flowState$,
      flowHasSteps: this.store.select(BuilderSelectors.selectFlowHasAnySteps),
      flowValid: this.store.select(BuilderSelectors.selectCurrentFlowValidity),
      isCurrentFlowVersionPublished: this.isCurrentFlowVersionPublished$,
      isShowingPublishedVersion: this.store.select(
        BuilderSelectors.selectIsInPublishedVersionViewMode
      ),
    }).pipe(
      map((res) => {
        return (
          (res.publishingSavingStates.isPublishing ||
            res.publishingSavingStates.isSaving ||
            !res.flowHasSteps ||
            !res.flowValid ||
            res.isCurrentFlowVersionPublished) &&
          !res.isShowingPublishedVersion
        );
      })
    );
    this.buttonTooltipText$ = combineLatest({
      buttonIsDisabled: this.disablePublishButton$,
      flowHasSteps: this.store.select(BuilderSelectors.selectFlowHasAnySteps),
      isCurrentFlowVersionPublished: this.isCurrentFlowVersionPublished$,
      isShowingPublishedVersion: this.store.select(
        BuilderSelectors.selectIsInPublishedVersionViewMode
      ),
    }).pipe(
      map((res) => {
        if (res.isShowingPublishedVersion) {
          return $localize`Edit`;
        }
        if (!res.flowHasSteps) {
          return $localize`Add 1 more step to publish`;
        } else if (res.isCurrentFlowVersionPublished) {
          return $localize`Published`;
        } else if (res.buttonIsDisabled) {
          return $localize`Your flow has invalid steps`;
        }
        return $localize`Publish Flow`;
      })
    );
    this.publishBtnText$ = this.flowState$.pipe(
      map((res) => {
        if (res.isSaving) {
          return $localize`Saving`;
        } else if (res.isPublishing) {
          return $localize`Publishing`;
        }
        return $localize`Publish`;
      })
    );
  }

  publishButtonClicked() {
    this.store.dispatch(FlowsActions.publish());
  }
  editFlowButtonClicked() {
    this.store.dispatch(
      ViewModeActions.setViewMode({ viewMode: ViewModeEnum.BUILDING })
    );
  }
}

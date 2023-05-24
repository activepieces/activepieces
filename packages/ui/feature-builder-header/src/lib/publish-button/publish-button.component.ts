import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, map, Observable, of, take, tap } from 'rxjs';
import {
  BuilderSelectors,
  FlowInstanceActions,
  ViewModeEnum,
  ViewModeActions,
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
  buttonText$: Observable<string>;
  isCurrentFlowVersionPublished$: Observable<boolean>;
  dispatchAction$: Observable<void>;
  constructor(private store: Store) {}

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
      }),
      tap((res) => {
        console.log(res);
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
          return 'Edit';
        }
        if (!res.flowHasSteps) {
          return 'Add 1 more step to publish';
        } else if (res.isCurrentFlowVersionPublished) {
          return 'Published';
        } else if (res.buttonIsDisabled) {
          return 'Your flow has invalid steps';
        }
        return 'Publish Flow';
      })
    );
    this.buttonText$ = this.flowState$.pipe(
      map((res) => {
        if (res.isShowingPublishedVersion) {
          return 'Edit Flow';
        }
        if (res.isSaving) {
          return 'Saving';
        } else if (res.isPublishing) {
          return 'Publishing';
        }
        return 'Publish';
      })
    );
  }

  buttonClicked() {
    this.dispatchAction$ = this.store
      .select(BuilderSelectors.selectIsInPublishedVersionViewMode)
      .pipe(
        take(1),
        tap((res) => {
          if (res) {
            this.store.dispatch(
              ViewModeActions.setViewMode({ viewMode: ViewModeEnum.BUILDING })
            );
          } else {
            this.store.dispatch(FlowInstanceActions.publish());
          }
        }),
        map(() => void 0)
      );
  }
}

import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, delay, map, Observable, of } from 'rxjs';
import { BuilderSelectors } from '@activepieces/ui/feature-builder-store';

@Component({
  selector: 'app-publish-button',
  templateUrl: './publish-button.component.html',
  styleUrls: ['./publish-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublishButtonComponent implements OnInit {
  collectionState$: Observable<{ isSaving: boolean; isPublishing: boolean }>;
  isDeployingOrIsSaving$: Observable<boolean>;
  deploying$: Observable<boolean> = of(false);
  disableDeployButton$: Observable<boolean>;
  buttonTooltipText$: Observable<string>;
  buttonText$: Observable<string>;
  constructor(private store: Store) {}

  ngOnInit(): void {
    this.setCollectionStateListener();
  }

  private setCollectionStateListener() {
    this.collectionState$ = combineLatest({
      isSaving: this.store.select(BuilderSelectors.selectIsSaving),
      isPublishing: this.store.select(BuilderSelectors.selectIsPublishing),
    });
    this.disableDeployButton$ = combineLatest({
      publishingSavingStates: this.collectionState$,
    }).pipe(
      map((res) => {
        return (
          res.publishingSavingStates.isPublishing ||
          res.publishingSavingStates.isSaving
          // || !res.anyFlowHasSteps TODO FIX
        );
      })
    );
    this.buttonTooltipText$ = combineLatest({
      buttonIsDisabled: this.disableDeployButton$,
    }).pipe(
      delay(100),
      map((res) => {
        // TODO FIX THIS
        /*if (!res.anyFlowHasSteps) {
          return 'At least one flow has to have a step after its trigger';
        } else if (res.buttonIsDisabled) {
          return 'Please fix all flows';
        } else {
          return 'Publish collection';
        }*/
        return 'Publish collection';
      })
    );
    this.buttonText$ = this.collectionState$.pipe(
      delay(100),
      map((res) => {
        if (res.isSaving) {
          return 'Saving';
        } else if (res.isPublishing) {
          return 'Publishing';
        }
        return 'Publish';
      })
    );
  }

  publish() {
    // TODO FIX
    //this.store.dispatch(CollectionActions.publish());
  }
}

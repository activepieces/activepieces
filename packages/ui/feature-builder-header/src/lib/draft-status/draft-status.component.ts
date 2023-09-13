import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  BuilderSelectors,
  ViewModeActions,
  ViewModeEnum,
} from '@activepieces/ui/feature-builder-store';
import { Observable, combineLatest, map } from 'rxjs';

@Component({
  selector: 'app-draft-status',
  templateUrl: './draft-status.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DraftStatusComponent {
  draftStatus$: Observable<string>;
  isCurrentFlowVersionPublished$: Observable<boolean>;
  hasFlowBeenPublished$: Observable<boolean>;
  constructor(private store: Store) {
    this.isCurrentFlowVersionPublished$ = this.store.select(
      BuilderSelectors.selectIsCurrentVersionPublished
    );
    this.hasFlowBeenPublished$ = this.store.select(
      BuilderSelectors.selectHasFlowBeenPublished
    );
    this.draftStatus$ = combineLatest({
      isCurrentVersionPublished: this.store.select(
        BuilderSelectors.selectIsCurrentVersionPublished
      ),
      isInPublishedVersionView: this.store.select(
        BuilderSelectors.selectIsInPublishedVersionViewMode
      ),
    }).pipe(
      map((res) => {
        if (res.isCurrentVersionPublished || res.isInPublishedVersionView) {
          return $localize`Published`;
        }
        return $localize`Draft`;
      })
    );
  }

  showPublishedVersion() {
    this.store.dispatch(
      ViewModeActions.setViewMode({ viewMode: ViewModeEnum.SHOW_PUBLISHED })
    );
  }
  showDraftVersion() {
    this.store.dispatch(
      ViewModeActions.setViewMode({ viewMode: ViewModeEnum.BUILDING })
    );
  }
}

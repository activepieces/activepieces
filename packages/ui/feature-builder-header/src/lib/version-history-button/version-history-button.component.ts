import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  BuilderSelectors,
  LeftSideBarType,
  canvasActions,
  VersionHistoricalStatus,
} from '@activepieces/ui/feature-builder-store';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-version-history-button',
  templateUrl: './version-history-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VersionHistroryButtonComponent {
  versionHistoricalStatus$: Observable<VersionHistoricalStatus>;
  versionHistoricalStatusTooltip$: Observable<string>;
  constructor(private store: Store) {
    this.versionHistoricalStatus$ = this.store.select(
      BuilderSelectors.selectViewedVersionHistoricalStatus
    );
    this.versionHistoricalStatusTooltip$ = this.versionHistoricalStatus$.pipe(
      map((res) => {
        switch (res) {
          case 'DRAFT':
            return $localize`Viewing draft`;
          case 'PUBLISHED':
            return $localize`Viewing published version`;
          case 'OLDER_VERSION':
            return $localize`Viewing older version`;
        }
      })
    );
  }

  showVersionHistory() {
    this.store.dispatch(
      canvasActions.setLeftSidebar({
        sidebarType: LeftSideBarType.VERSIONS_HISTORY,
      })
    );
  }
}

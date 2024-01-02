import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  LeftSideBarType,
  canvasActions,
} from '@activepieces/ui/feature-builder-store';

@Component({
  selector: 'app-version-history-button',
  templateUrl: './version-history-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VersionHistroryButtonComponent {
  constructor(private store: Store) {}

  showVersionHistory() {
    this.store.dispatch(
      canvasActions.setLeftSidebar({
        sidebarType: LeftSideBarType.VERSIONS_HISTORY,
      })
    );
  }
}

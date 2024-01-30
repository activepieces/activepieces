import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  LeftSideBarType,
  canvasActions,
} from '@activepieces/ui/feature-builder-store';

@Component({
  selector: 'app-runs-button',
  templateUrl: './runs-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RunsButtonComponent {
  constructor(private store: Store) {}
  showRuns() {
    this.store.dispatch(
      canvasActions.setLeftSidebar({
        sidebarType: LeftSideBarType.RUNS_LIST,
      })
    );
  }
}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  NO_PROPS,
  RightSideBarType,
  canvasActions,
} from '@activepieces/ui/feature-builder-store';

@Component({
  selector: 'app-replace-trigger-action',
  templateUrl: './replace-trigger-action.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplaceTriggerActionComponent {
  constructor(private store: Store) {}
  replaceTrigger() {
    this.store.dispatch(
      canvasActions.setRightSidebar({
        sidebarType: RightSideBarType.TRIGGER_TYPE,
        props: NO_PROPS,
        deselectCurrentStep: false,
      })
    );
  }
}

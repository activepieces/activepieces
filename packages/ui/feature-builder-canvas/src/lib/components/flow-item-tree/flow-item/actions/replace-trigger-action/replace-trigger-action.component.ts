import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import {
  NO_PROPS,
  RightSideBarType,
  canvasActions,
} from '@activepieces/ui/feature-builder-store';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
@Component({
  selector: 'app-replace-trigger-action',
  templateUrl: './replace-trigger-action.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplaceTriggerActionComponent {
  replaceTriggerIsActive$: Observable<boolean>;
  @Input({ required: true }) replaceTriggerIsActive = false;
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

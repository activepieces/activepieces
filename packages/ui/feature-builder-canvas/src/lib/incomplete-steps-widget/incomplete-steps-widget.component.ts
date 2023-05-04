import { ChangeDetectionStrategy, Component } from '@angular/core';
import { fadeIn400ms } from '@activepieces/ui/common';
import { Store } from '@ngrx/store';
import {
  BuilderSelectors,
  FlowsActions,
} from '@activepieces/ui/feature-builder-store';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-incomplete-steps-widget',
  templateUrl: './incomplete-steps-widget.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeIn400ms],
})
export class IncompleteStepsWidgetComponent {
  numberOfInvalidSteps$: Observable<number>;
  constructor(private store: Store) {
    this.numberOfInvalidSteps$ = this.store.select(
      BuilderSelectors.selectNumberOfInvalidSteps
    );
  }
  selectFirstInvalidStep() {
    this.store.dispatch(FlowsActions.selectFirstInvalidStep());
  }
}

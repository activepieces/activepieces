import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BuilderSelectors } from '@activepieces/ui/feature-builder-store';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { fadeIn400ms } from '@activepieces/ui/common';

@Component({
  selector: 'app-view-only-mode',
  templateUrl: './view-only-mode.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeIn400ms],
})
export class ViewOnlyModeComponent {
  isInReadOnlyMode$: Observable<boolean>;
  constructor(private store: Store) {
    this.isInReadOnlyMode$ = this.store.select(BuilderSelectors.selectReadOnly);
  }
}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { BuilderSelectors } from '@activepieces/ui/feature-builder-store';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-draft-status',
  templateUrl: './draft-status.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DraftStatusComponent {
  isCurrentVersionPublished$: Observable<boolean>;
  constructor(private store: Store) {
    this.isCurrentVersionPublished$ = this.store.select(
      BuilderSelectors.selectIsCurrentVersionPublished
    );
  }
}

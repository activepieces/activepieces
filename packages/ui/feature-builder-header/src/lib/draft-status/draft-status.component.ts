import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { BuilderSelectors } from '@activepieces/ui/feature-builder-store';
import { Observable, combineLatest, map } from 'rxjs';

@Component({
  selector: 'app-draft-status',
  templateUrl: './draft-status.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DraftStatusComponent {
  draftStatus$: Observable<string>;
  constructor(private store: Store) {
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
          return 'Published';
        }
        return 'Draft';
      })
    );
  }
}

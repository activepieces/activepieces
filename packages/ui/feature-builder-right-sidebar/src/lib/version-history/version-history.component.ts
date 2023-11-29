import { FlowOperationType, FlowVersion, SeekPage } from '@activepieces/shared';
import { FlowService } from '@activepieces/ui/common';
import {
  BuilderSelectors,
  FlowsActions,
} from '@activepieces/ui/feature-builder-store';
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, catchError, map, of, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-version-history',
  templateUrl: './version-history.component.html',
  styleUrls: [],
})
export class VersionHistoryComponent implements OnInit {
  flowVersions$: Observable<SeekPage<FlowVersion>>;
  rollbackVersion$: Observable<void>;
  loading = false;
  constructor(private flowService: FlowService, private store: Store) {}

  ngOnInit(): void {
    this.flowVersions$ = this.store
      .select(BuilderSelectors.selectCurrentFlow)
      .pipe(switchMap((flow) => this.flowService.listVersions(flow.id)));
  }

  rollback(flowVersion: FlowVersion) {
    if (this.loading) {
      return;
    }
    this.loading = true;
    this.rollbackVersion$ = this.flowService
      .update(flowVersion.flowId, {
        type: FlowOperationType.ROLLBACK,
        request: {
          versionId: flowVersion.id,
        },
      })
      .pipe(
        tap((flow) => {
          this.loading = false;
          this.store.dispatch(FlowsActions.importFlow({ flow }));
        }),
        catchError(() => {
          this.loading = false;
          return of(void 0);
        }),
        map(() => void 0)
      );
  }
}

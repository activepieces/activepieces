import { FlowOperationType, FlowVersion, SeekPage } from '@activepieces/shared';
import { FlowService } from '@activepieces/ui/common';
import {
  BuilderSelectors,
  FlowsActions,
  LeftSideBarType,
  ViewModeActions,
  ViewModeEnum,
  canvasActions,
} from '@activepieces/ui/feature-builder-store';
import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  Observable,
  catchError,
  forkJoin,
  map,
  of,
  switchMap,
  tap,
  take,
} from 'rxjs';
import {
  UseAsDraftConfirmationDialogComponent,
  UseAsDraftConfirmationDialogData,
} from '../dialogs/use-as-draft-confirmation-dialog/use-as-draft-confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-version-history',
  templateUrl: './version-history.component.html',

})
export class VersionHistoryComponent {
  sideBarDisplayName = $localize`Versions`;
  flowVersions$: Observable<SeekPage<FlowVersion>>;
  useAsDraft$?: Observable<void>;
  rewritingDraft = false;
  publishedVersion$: Observable<FlowVersion | undefined>;
  draftVersionId$: Observable<string>;
  displayVersion$?: Observable<unknown>;
  viewedVersion$: Observable<FlowVersion>;
  constructor(
    private flowService: FlowService,
    private store: Store,
    private matDialog: MatDialog
  ) {
    this.flowVersions$ = this.store
      .select(BuilderSelectors.selectCurrentFlow)
      .pipe(switchMap((flow) => this.flowService.listVersions(flow.id)));
    this.publishedVersion$ = this.store.select(
      BuilderSelectors.selectPublishedFlowVersion
    );
    this.draftVersionId$ = this.store.select(
      BuilderSelectors.selectCurrentFlowVersionId
    );
    this.viewedVersion$ = this.store.select(
      BuilderSelectors.selectViewedVersion
    );
  }

  useAsDraft(flowVersion: FlowVersion, versionNumber: number) {
    if (this.rewritingDraft) {
      return;
    }
    const useAsDraftRequest$ = this.flowService
      .update(flowVersion.flowId, {
        type: FlowOperationType.USE_AS_DRAFT,
        request: {
          versionId: flowVersion.id,
        },
      })
      .pipe(
        tap((flow) => {
          this.rewritingDraft = false;
          this.store.dispatch(FlowsActions.importFlow({ flow }));
          this.viewDraftVersion();
          this.closeSidebar();
        }),
        catchError(() => {
          this.rewritingDraft = false;
          return of(void 0);
        }),
        map(() => void 0)
      );

    const data: UseAsDraftConfirmationDialogData = {
      versionNumber,
    };
    this.useAsDraft$ = this.matDialog
      .open(UseAsDraftConfirmationDialogComponent, {
        data,
      })
      .afterClosed()
      .pipe(
        switchMap((confirmed) => {
          if (confirmed) {
            this.rewritingDraft = true;
            return useAsDraftRequest$;
          }
          return of(void 0);
        })
      );
  }
  closeSidebar() {
    this.store.dispatch(
      canvasActions.setLeftSidebar({
        sidebarType: LeftSideBarType.NONE,
      })
    );
  }

  displayVersion(flowVersion: FlowVersion) {
    this.displayVersion$ = forkJoin({
      flow: this.flowService.get(flowVersion.flowId, flowVersion.id),
      published: this.store
        .select(BuilderSelectors.selectPublishedFlowVersion)
        .pipe(take(1)),
      draftId: this.store
        .select(BuilderSelectors.selectCurrentFlowVersionId)
        .pipe(take(1)),
    }).pipe(
      tap(({ flow, published, draftId }) => {
        if (flow.version.id === published?.id) {
          this.viewPublishedVersion();
        } else if (flow.version.id === draftId) {
          this.viewDraftVersion();
        } else {
          this.store.dispatch(
            ViewModeActions.setViewMode({
              viewMode: ViewModeEnum.SHOW_OLD_VERSION,
              version: flow.version,
            })
          );
        }
      })
    );
  }
  viewDraftVersion() {
    this.store.dispatch(
      ViewModeActions.setViewMode({
        viewMode: ViewModeEnum.BUILDING,
      })
    );
  }
  viewPublishedVersion() {
    this.store.dispatch(
      ViewModeActions.setViewMode({
        viewMode: ViewModeEnum.SHOW_PUBLISHED,
      })
    );
  }
}

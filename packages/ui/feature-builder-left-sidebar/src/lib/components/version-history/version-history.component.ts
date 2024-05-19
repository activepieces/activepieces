import {
  FlowOperationType,
  FlowVersion,
  FlowVersionMetadata,
  SeekPage,
} from '@activepieces/shared';
import { FlowService, VersionHisoricalStatus } from '@activepieces/ui/common';
import {
  BuilderSelectors,
  FlowsActions,
  LeftSideBarType,
  NO_PROPS,
  RightSideBarType,
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
  VersionHisoricalStatus = VersionHisoricalStatus;
  sideBarDisplayName = $localize`Versions`;
  flowVersions$: Observable<SeekPage<FlowVersionMetadata>>;
  useAsDraft$?: Observable<void>;
  rewritingDraft = false;
  publishedVersion$: Observable<FlowVersionMetadata | undefined>;
  draftVersionId$: Observable<string>;
  displayVersion$?: Observable<unknown>;
  viewedVersion$: Observable<FlowVersionMetadata>;
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
      BuilderSelectors.selectDraftVersionId
    );
    this.viewedVersion$ = this.store.select(
      BuilderSelectors.selectViewedVersion
    );
  }

  useAsDraft(flowVersion: FlowVersionMetadata, versionNumber: number) {
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
          this.closeLeftSidebar();
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
  closeLeftSidebar() {
    this.store.dispatch(
      canvasActions.setLeftSidebar({
        sidebarType: LeftSideBarType.NONE,
      })
    );
  }

  displayVersion(flowVersion: FlowVersionMetadata) {
    this.closeRightSidebar();
    setTimeout(() => {
      this.displayVersion$ = forkJoin({
        flow: this.flowService.get(flowVersion.flowId, flowVersion.id),
        published: this.store
          .select(BuilderSelectors.selectPublishedFlowVersion)
          .pipe(take(1)),
        draftId: this.store
          .select(BuilderSelectors.selectDraftVersionId)
          .pipe(take(1)),
      }).pipe(
        tap(({ flow, published, draftId }) => {
          if (flow.version.id === published?.id) {
            this.viewPublishedVersion();
          } else if (flow.version.id === draftId) {
            this.viewDraftVersion();
          } else {
            this.viewOldVersion(flow.version);
          }
        })
      );
    });
  }
  private viewOldVersion(version: FlowVersion) {
    this.store.dispatch(
      ViewModeActions.setViewMode({
        viewMode: ViewModeEnum.SHOW_OLD_VERSION,
        version: version,
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
  closeRightSidebar() {
    this.store.dispatch(
      canvasActions.setRightSidebar({
        sidebarType: RightSideBarType.NONE,
        props: NO_PROPS,
        deselectCurrentStep: true,
      })
    );
  }
}

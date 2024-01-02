import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, Observable, switchMap, take, tap } from 'rxjs';
import {
  AppearanceService,
  DeleteEntityDialogComponent,
  DeleteEntityDialogData,
  FlagService,
  FlowService,
  NavigationService,
  environment,
  fadeIn400ms,
} from '@activepieces/ui/common';
import { MatDialog } from '@angular/material/dialog';
import {
  BuilderSelectors,
  CollectionBuilderService,
  FlowsActions,
  LeftSideBarType,
  canvasActions,
} from '@activepieces/ui/feature-builder-store';
import { FlowStatus, PopulatedFlow } from '@activepieces/shared';
import { EmbeddingService } from '@activepieces/ui/common';
import { ImportFlowDialogueComponent } from './import-flow-dialogue/import-flow-dialogue.component';

@Component({
  selector: 'app-flow-builder-header',
  templateUrl: './flow-builder-header.component.html',
  styleUrls: ['./flow-builder-header.component.scss'],
  animations: [fadeIn400ms],
})
export class FlowBuilderHeaderComponent implements OnInit {
  isInDebugMode$: Observable<boolean>;
  isInReadOnlyMode$: Observable<boolean>;
  flowStatus$: Observable<FlowStatus>;
  flow$: Observable<PopulatedFlow>;
  editingFlowName = false;
  downloadFile$: Observable<void>;
  shareFlow$: Observable<void>;
  deleteFlowDialogClosed$: Observable<void>;
  folderDisplayName$: Observable<string>;
  duplicateFlow$: Observable<void>;
  openDashboardOnFolder$: Observable<string>;
  environment = environment;
  fullLogo$: Observable<string>;
  setTitle$: Observable<void>;
  isInEmbedded$: Observable<boolean>;
  hasFlowBeenPublished$: Observable<boolean>;
  showNavigation$: Observable<boolean>;
  goToFolder = $localize`Go to folder`;
  constructor(
    public dialogService: MatDialog,
    private store: Store,
    private router: Router,
    private appearanceService: AppearanceService,
    public collectionBuilderService: CollectionBuilderService,
    private flowService: FlowService,
    private matDialog: MatDialog,
    private flagService: FlagService,
    private embeddingService: EmbeddingService,
    private navigationService: NavigationService
  ) {
    this.hasFlowBeenPublished$ = this.store.select(
      BuilderSelectors.selectHasFlowBeenPublished
    );
    this.isInEmbedded$ = this.embeddingService.getIsInEmbedding$();
    this.showNavigation$ = this.embeddingService.getShowNavigationInBuilder$();
    this.fullLogo$ = this.flagService
      .getLogos()
      .pipe(map((logos) => logos.fullLogoUrl));
  }

  ngOnInit(): void {
    this.flowStatus$ = this.store.select(BuilderSelectors.selectFlowStatus);
    this.isInDebugMode$ = this.store.select(
      BuilderSelectors.selectIsInDebugMode
    );
    this.isInReadOnlyMode$ = this.store.select(BuilderSelectors.selectReadOnly);
    this.flow$ = this.store.select(BuilderSelectors.selectCurrentFlow);
    this.folderDisplayName$ = this.store.select(
      BuilderSelectors.selectCurrentFlowFolderName
    );
  }
  changeEditValue(event: boolean) {
    this.editingFlowName = event;
  }
  redirectHome(newWindow: boolean) {
    if (this.router.url.includes('/runs')) {
      this.navigationService.navigate('/runs', newWindow);
    } else {
      this.navigationService.navigate('/flows', newWindow);
    }
  }
  saveFlowName(flowName: string) {
    this.setTitle$ = this.appearanceService.setTitle(flowName);
    this.store.dispatch(FlowsActions.changeName({ displayName: flowName }));
  }

  duplicate() {
    this.duplicateFlow$ = this.store
      .select(BuilderSelectors.selectCurrentFlow)
      .pipe(
        take(1),
        switchMap((currentFlow) => {
          return this.flowService.duplicate(currentFlow.id);
        }),
        map(() => void 0)
      );
  }

  download(id: string) {
    this.downloadFile$ = this.flowService.exportTemplate(id, undefined).pipe(
      tap((json) => {
        const blob = new Blob([JSON.stringify(json, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'template.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }),
      map(() => {
        return void 0;
      })
    );
  }

  import() {
    this.matDialog.open(ImportFlowDialogueComponent);
  }

  deleteFlow(flow: PopulatedFlow) {
    const dialogData: DeleteEntityDialogData = {
      deleteEntity$: this.flowService.delete(flow.id),
      entityName: flow.version.displayName,
      note: $localize`This will permanently delete the flow, all its data and any background runs.
      You can't undo this action.`,
    };
    const dialogRef = this.dialogService.open(DeleteEntityDialogComponent, {
      data: dialogData,
    });
    this.deleteFlowDialogClosed$ = dialogRef.beforeClosed().pipe(
      tap((res) => {
        if (res) {
          this.router.navigate(['/']);
        }
      }),
      map(() => {
        return void 0;
      })
    );
  }

  showVersions() {
    this.store.dispatch(
      canvasActions.setLeftSidebar({
        sidebarType: LeftSideBarType.VERSIONS_HISTORY,
      })
    );
  }
  openDashboardToFolder() {
    this.openDashboardOnFolder$ = this.store
      .select(BuilderSelectors.selectCurrentFlowFolderId)
      .pipe(
        take(1),
        tap((folderId) => {
          this.router.navigate(['/flows'], {
            queryParams: {
              folderId,
            },
          });
        })
      );
  }
}

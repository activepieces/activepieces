import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, Observable, tap } from 'rxjs';
import {
  AppearanceService,
  FlagService,
  NavigationService,
  environment,
  fadeIn400ms,
  flowActionsUiInfo,
} from '@activepieces/ui/common';
import { MatDialog } from '@angular/material/dialog';
import {
  BuilderSelectors,
  FlowsActions,
  LeftSideBarType,
  canvasActions,
} from '@activepieces/ui/feature-builder-store';
import { FlowStatus, PopulatedFlow } from '@activepieces/shared';
import { EmbeddingService, FlowBuilderService } from '@activepieces/ui/common';
import { FLOW_BUILDER_HEADER_HEIGHT } from '@activepieces/ui-canvas-utils';
import { FoldersSelectors } from '@activepieces/ui/feature-folders-store';

@Component({
  selector: 'app-flow-builder-header',
  templateUrl: './flow-builder-header.component.html',
  styleUrls: ['./flow-builder-header.component.scss'],
  animations: [fadeIn400ms],
})
export class FlowBuilderHeaderComponent implements OnInit {
  readonly flowActionsUiInfo = flowActionsUiInfo;
  readonly FLOW_BUILDER_HEADER_HEIGHT = FLOW_BUILDER_HEADER_HEIGHT + 'px';
  isInDebugMode$: Observable<boolean>;
  isInReadOnlyMode$: Observable<boolean>;
  flowStatus$: Observable<FlowStatus>;
  flow$: Observable<PopulatedFlow>;
  editingFlowName = false;
  downloadFile$: Observable<void>;
  shareFlow$: Observable<void>;
  deleteFlowDialogClosed$: Observable<void>;
  folderDisplayName$: Observable<string>;
  duplicateFlow$?: Observable<void>;
  openDashboardOnFolder$?: Observable<string | undefined>;
  environment = environment;
  fullLogo$: Observable<string>;
  setTitle$: Observable<void>;
  isInEmbedded$: Observable<boolean>;
  hasFlowBeenPublished$: Observable<boolean>;
  showNavigation$: Observable<boolean>;
  goToFolder = $localize`Go to folder`;
  hideLogo$ = this.embeddingService.getHideLogoInBuilder$();
  hideFlowName$ = this.embeddingService.getHideFLowNameInBuilder$();
  hideFolders$ = this.embeddingService.getHideFolders$();
  constructor(
    public matDialog: MatDialog,
    private store: Store,
    private router: Router,
    private appearanceService: AppearanceService,
    public collectionBuilderService: FlowBuilderService,
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
      FoldersSelectors.selectCurrentFolderName
    );
  }

  changeEditValue(event: boolean) {
    this.editingFlowName = event;
  }

  redirectHome(openInNewWindow: boolean) {
    if (this.router.url.includes('/runs')) {
      this.navigationService.navigate({
        route: ['/runs'],
        openInNewWindow,
      });
    } else {
      this.navigationService.navigate({
        route: ['/flows'],
        openInNewWindow,
      });
    }
  }
  saveFlowName(flowName: string) {
    this.setTitle$ = this.appearanceService.setTitle(flowName);
    this.store.dispatch(FlowsActions.changeName({ displayName: flowName }));
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
      .select(FoldersSelectors.selectCurrentFolderId)
      .pipe(
        tap((folderId) => {
          this.navigationService.navigate({
            route: ['/flows'],
            extras: {
              queryParams: {
                folderId: folderId ? folderId : 'NULL',
              },
            },
          });
        })
      );
  }
  flowDeleted() {
    this.navigationService.navigate({
      route: ['/flows'],
      openInNewWindow: false,
    });
  }
}

import { ChangeDetectionStrategy, Component, Injector } from '@angular/core';
import { EMPTY, Observable, map, switchMap, take, tap } from 'rxjs';
import {
  PopulatedFlow,
  FolderDto,
  Project,
  FlowOperationType,
  TelemetryEventName,
} from '@activepieces/shared';
import { FoldersSelectors } from '@activepieces/ui/feature-folders-store';
import { Store } from '@ngrx/store';
import {
  FlowService,
  AuthenticationService,
  flowActionsUiInfo,
  ImportFlowDialogComponent,
  ImporFlowDialogData,
  ProjectSelectors,
  FlowBuilderService,
  TelemetryService,
  EmbeddingService,
} from '@activepieces/ui/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import {
  TemplatesDialogComponent,
  TemplateDialogData,
  TemplateDialogClosingResult,
  TemplateBlogNotificationComponent,
  BLOG_URL_TOKEN,
} from '@activepieces/ui/feature-templates';
import { ComponentPortal } from '@angular/cdk/portal';

@Component({
  selector: 'app-flows-table-title',
  templateUrl: './flows-table-title.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlowsTableTitleComponent {
  creatingFlow = false;
  currentFolder$: Observable<FolderDto | undefined>;
  createFlow$?: Observable<PopulatedFlow>;
  showAllFlows$: Observable<boolean>;
  currentProject$: Observable<Project>;
  openTemplatesDialog$?: Observable<void>;
  readonly flowActionsUiInfo = flowActionsUiInfo;
  hideFoldersList$ = this.embeddingService.getHideFolders$();
  constructor(
    private store: Store,
    private flowService: FlowService,
    private router: Router,
    private authenticationService: AuthenticationService,
    private matDialog: MatDialog,
    private builderService: FlowBuilderService,
    private telemetryService: TelemetryService,
    private embeddingService: EmbeddingService
  ) {
    this.currentProject$ = this.store.select(
      ProjectSelectors.selectCurrentProject
    );
    this.showAllFlows$ = this.store.select(
      FoldersSelectors.selectDisplayAllFlows
    );
    this.currentFolder$ = this.store.select(
      FoldersSelectors.selectCurrentFolder
    );
  }
  createFlow(navigateAfterCreation: boolean, name?: string) {
    if (!this.createFlow$) {
      if (navigateAfterCreation) {
        this.builderService.showLoading();
      }
      this.createFlow$ = this.currentFolder$.pipe(
        take(1),
        switchMap((res) => {
          return this.flowService
            .create({
              projectId: this.authenticationService.getProjectId(),
              displayName: name || $localize`Untitled`,
              folderId: res?.id,
            })
            .pipe(
              tap((flow) => {
                if (navigateAfterCreation) {
                  this.builderService.hideLoading();
                  this.router.navigate(['/flows/', flow.id]);
                }
              })
            );
        })
      );
    }
    return this.createFlow$;
  }
  openTemplatesDialog() {
    const data: TemplateDialogData = {
      insideBuilder: false,
    };
    this.openTemplatesDialog$ = this.matDialog
      .open(TemplatesDialogComponent, { data })
      .afterClosed()
      .pipe(
        switchMap((dialogResult?: TemplateDialogClosingResult) => {
          if (dialogResult) {
            this.builderService.showLoading();
            return this.createFlow(false, dialogResult.template.name).pipe(
              switchMap((flow) => {
                return this.flowService.update(flow.id, {
                  type: FlowOperationType.IMPORT_FLOW,
                  request: {
                    displayName: dialogResult.template.name,
                    trigger: dialogResult.template.template.trigger,
                  },
                });
              }),
              tap((flow) => {
                this.builderService.hideLoading();
                this.router.navigate(['/flows/', flow.id]);
                if (dialogResult.template.blogUrl) {
                  this.showBlogNotification(dialogResult.template.blogUrl);
                }
                this.telemetryService.capture({
                  name: TelemetryEventName.FLOW_IMPORTED,
                  payload: {
                    id: dialogResult.template.id,
                    name: dialogResult.template.name,
                    location: `inside the builder`,
                    tab: `${dialogResult.activeTab}`,
                  },
                });
              })
            );
          }
          return EMPTY;
        }),
        map(() => void 0)
      );
  }

  importFlow(projectId: string) {
    const data: ImporFlowDialogData = { projectId: projectId };
    this.matDialog.open(ImportFlowDialogComponent, { data });
  }

  private showBlogNotification(blogUrl: string) {
    this.builderService.componentToShowInsidePortal$.next(
      new ComponentPortal(
        TemplateBlogNotificationComponent,
        null,
        Injector.create({
          providers: [
            {
              provide: BLOG_URL_TOKEN,
              useValue: blogUrl,
            },
          ],
        })
      )
    );
  }
}

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Injector,
} from '@angular/core';
import { EMPTY, Observable, map, switchMap, take, tap } from 'rxjs';
import {
  PopulatedFlow,
  FolderDto,
  FlowOperationType,
  TelemetryEventName,
  ProjectWithLimits,
} from '@activepieces/shared';
import { FoldersSelectors } from '@activepieces/ui/feature-folders-store';
import { Store } from '@ngrx/store';
import {
  FlowService,
  AuthenticationService,
  flowActionsUiInfo,
  ImportFlowDialogComponent,
  ImporFlowDialogData,
  FlowBuilderService,
  TelemetryService,
  EmbeddingService,
  ProjectService,
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
  currentProject$: Observable<ProjectWithLimits>;
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
    private projectService: ProjectService,
    private telemetryService: TelemetryService,
    private embeddingService: EmbeddingService,
    private cd: ChangeDetectorRef
  ) {
    this.currentProject$ = this.projectService.currentProject$.pipe(
      map((project) => project!)
    );
    this.showAllFlows$ = this.store.select(
      FoldersSelectors.selectDisplayAllFlows
    );
    this.currentFolder$ = this.store.select(
      FoldersSelectors.selectCurrentFolder
    );
  }

  createFlowButtonClicked() {
    this.createFlow$ = this.createFlow(true);
  }
  createFlow(navigateAfterCreation: boolean, name?: string) {
    if (navigateAfterCreation) {
      this.builderService.showLoading();
    }
    return this.currentFolder$.pipe(
      take(1),
      switchMap((res) => {
        return this.flowService
          .create({
            projectId: this.authenticationService.getProjectId(),
            displayName: name || $localize`Untitled`,
            folderName: res?.displayName,
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
  openTemplatesDialog(showStartFromScratch?: boolean) {
    const data: TemplateDialogData = {
      insideBuilder: false,
      showStartFromScratch,
    };
    this.openTemplatesDialog$ = this.matDialog
      .open(TemplatesDialogComponent, { data })
      .afterClosed()
      .pipe(
        switchMap((dialogResult?: TemplateDialogClosingResult) => {
          if (dialogResult) {
            const template = dialogResult.template;
            this.builderService.showLoading();
            if (typeof template === 'string') {
              return this.createFlow(true);
            }

            return this.createFlow(false, template.name).pipe(
              switchMap((flow) => {
                return this.flowService.update(flow.id, {
                  type: FlowOperationType.IMPORT_FLOW,
                  request: {
                    displayName: template.name,
                    trigger: template.template.trigger,
                  },
                });
              }),
              tap((flow) => {
                this.builderService.hideLoading();
                this.router.navigate(['/flows/', flow.id]);
                if (template.blogUrl) {
                  this.showBlogNotification(template.blogUrl);
                }
                this.telemetryService.capture({
                  name: TelemetryEventName.FLOW_IMPORTED,
                  payload: {
                    id: template.id,
                    name: template.name,
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
    this.cd.markForCheck();
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

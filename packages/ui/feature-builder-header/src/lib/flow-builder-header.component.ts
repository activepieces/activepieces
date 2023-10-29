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
  environment,
  fadeIn400ms,
} from '@activepieces/ui/common';
import { MatDialog } from '@angular/material/dialog';
import {
  BuilderSelectors,
  CollectionBuilderService,
  FlowsActions,
} from '@activepieces/ui/feature-builder-store';
import { Flow, FlowInstance } from '@activepieces/shared';
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
  instance$: Observable<FlowInstance | undefined>;
  flow$: Observable<Flow>;
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
  constructor(
    public dialogService: MatDialog,
    private store: Store,
    private router: Router,
    private appearanceService: AppearanceService,
    public collectionBuilderService: CollectionBuilderService,
    private flowService: FlowService,
    private matDialog: MatDialog,
    private flagService: FlagService
  ) {
    this.fullLogo$ = this.flagService
      .getLogos()
      .pipe(map((logos) => logos.fullLogoUrl));
  }

  ngOnInit(): void {
    this.instance$ = this.store.select(BuilderSelectors.selectCurrentInstance);
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
    if (newWindow) {
      const url = this.router.serializeUrl(this.router.createUrlTree([``]));
      window.open(url, '_blank', 'noopener');
    } else {
      const urlArrays = this.router.url.split('/');
      urlArrays.splice(urlArrays.length - 1, 1);
      const fixedUrl = urlArrays.join('/');
      this.router.navigate([fixedUrl]);
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

  deleteFlow(flow: Flow) {
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

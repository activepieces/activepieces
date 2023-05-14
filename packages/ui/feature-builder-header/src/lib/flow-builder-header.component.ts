import {
  AfterViewInit,
  Component,
  EventEmitter,
  OnInit,
  Output,
} from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, Observable, switchMap, take, tap } from 'rxjs';
import {
  DeleteEntityDialogComponent,
  DeleteEntityDialogData,
  FlagService,
  FlowService,
  fadeIn400ms,
  initialiseBeamer,
} from '@activepieces/ui/common';
import { MatDialog } from '@angular/material/dialog';
import {
  BuilderSelectors,
  CollectionBuilderService,
  FlowsActions,
} from '@activepieces/ui/feature-builder-store';
import { ApEdition, Flow, FlowInstance } from '@activepieces/shared';

@Component({
  selector: 'app-flow-builder-header',
  templateUrl: './flow-builder-header.component.html',
  styleUrls: ['./flow-builder-header.component.scss'],
  animations: [fadeIn400ms],
})
export class FlowBuilderHeaderComponent implements OnInit, AfterViewInit {
  viewMode$: Observable<boolean>;
  isGeneratingFlowComponentOpen$: Observable<boolean>;
  instance$: Observable<FlowInstance | undefined>;
  flow$: Observable<Flow>;
  editingFlowName = false;
  deleteFlowDialogClosed$: Observable<void>;
  folderDisplayName$: Observable<string>;
  duplicateFlow$: Observable<void>;
  showGuessFlowBtn$: Observable<boolean>;
  @Output()
  showAiHelper = new EventEmitter<boolean>();
  constructor(
    public dialogService: MatDialog,
    private store: Store,
    private router: Router,
    public collectionBuilderService: CollectionBuilderService,
    private flowService: FlowService,
    private flagsService: FlagService
  ) {
    this.isGeneratingFlowComponentOpen$ = this.store.select(
      BuilderSelectors.selectIsGeneratingFlowComponentOpen
    );
  }

  ngOnInit(): void {
    initialiseBeamer();
    this.instance$ = this.store.select(BuilderSelectors.selectCurrentInstance);
    this.viewMode$ = this.store.select(BuilderSelectors.selectReadOnly);
    this.flow$ = this.store.select(BuilderSelectors.selectCurrentFlow);
    this.folderDisplayName$ = this.store.select(
      BuilderSelectors.selectCurrentFlowFolderName
    );
    this.showGuessFlowBtn$ = this.flagsService
      .getEdition()
      .pipe(map((ed) => ed === ApEdition.ENTERPRISE));
  }
  changeEditValue(event: boolean) {
    this.editingFlowName = event;
  }
  ngAfterViewInit(): void {
    if (localStorage.getItem('SHOW_AI_AFTER_CREATING_FLOW')) {
      this.guessFlowButtonClicked();
      localStorage.removeItem('SHOW_AI_AFTER_CREATING_FLOW');
    }
  }
  redirectHome(newWindow: boolean) {
    if (newWindow) {
      const url = this.router.serializeUrl(this.router.createUrlTree([``]));
      window.open(url, '_blank');
    } else {
      const urlArrays = this.router.url.split('/');
      urlArrays.splice(urlArrays.length - 1, 1);
      const fixedUrl = urlArrays.join('/');
      this.router.navigate([fixedUrl]);
    }
  }
  saveFlowName(flowName: string) {
    this.store.dispatch(FlowsActions.changeName({ displayName: flowName }));
  }

  duplicate() {
    this.duplicateFlow$ = this.store
      .select(BuilderSelectors.selectCurrentFlow)
      .pipe(
        take(1),
        switchMap((currentFlow) => {
          return this.flowService.duplicate(currentFlow);
        }),
        map(() => void 0)
      );
  }

  deleteFlow(flow: Flow) {
    const dialogData: DeleteEntityDialogData = {
      deleteEntity$: this.flowService.delete(flow.id),
      entityName: flow.version.displayName,
      note: `This will permanently delete the flow, all its data and any background runs.
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
  guessFlowButtonClicked() {
    this.store.dispatch(FlowsActions.openGenerateFlowComponent());
    this.showAiHelper.emit(true);
  }
}

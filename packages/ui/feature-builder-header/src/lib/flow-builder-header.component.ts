import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, Observable, tap } from 'rxjs';
import {
  DeleteEntityDialogComponent,
  DeleteEntityDialogData,
  FlowService,
  fadeIn400ms,
} from '@activepieces/ui/common';
import { MagicWandDialogComponent } from './magic-wand-dialog/magic-flow-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import {
  BuilderSelectors,
  CollectionBuilderService,
  FlowsActions,
} from '@activepieces/ui/feature-builder-store';
import { Flow, FlowInstance } from '@activepieces/shared';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-flow-builder-header',
  templateUrl: './flow-builder-header.component.html',
  styleUrls: ['./flow-builder-header.component.scss'],
  animations: [fadeIn400ms],
})
export class FlowBuilderHeaderComponent implements OnInit {
  viewMode$: Observable<boolean>;
  magicWandEnabled$: Observable<boolean>;
  instance$: Observable<FlowInstance | undefined>;
  flow$: Observable<Flow>;
  editingFlowName = false;
  deleteFlowDialogClosed$: Observable<void>;
  constructor(
    public dialogService: MatDialog,
    private store: Store,
    private router: Router,
    public collectionBuilderService: CollectionBuilderService,
    private route: ActivatedRoute,
    private snackbar: MatSnackBar,
    private flowService: FlowService
  ) {}

  ngOnInit(): void {
    this.instance$ = this.store.select(BuilderSelectors.selectCurrentInstance);
    this.viewMode$ = this.store.select(BuilderSelectors.selectReadOnly);
    this.flow$ = this.store.select(BuilderSelectors.selectCurrentFlow);
    this.magicWandEnabled$ = this.route.queryParams.pipe(
      map((params) => {
        return !!params['magicWand'];
      })
    );
  }
  changeEditValue(event: boolean) {
    this.editingFlowName = event;
  }
  guessAi() {
    this.dialogService.open(MagicWandDialogComponent);
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
  copyId(id: string) {
    this.snackbar.open(`ID copied`);
    navigator.clipboard.writeText(id);
  }
  deleteFlow(flow: Flow) {
    const dialogData: DeleteEntityDialogData = {
      deleteEntity$: this.flowService.delete(flow.id),
      entityName: flow.version.displayName,
      note:`This will permanently delete the flow, all its data and any background runs.
      You can't undo this action.`
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
}

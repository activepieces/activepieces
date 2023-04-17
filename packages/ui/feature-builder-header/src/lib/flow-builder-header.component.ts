import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, Observable } from 'rxjs';
import { fadeIn400ms } from '@activepieces/ui/common';
import { MagicWandDialogComponent } from './magic-wand-dialog/magic-flow-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import {
  BuilderSelectors,
  CollectionBuilderService,
  FlowsActions,
} from '@activepieces/ui/feature-builder-store';
import { Flow, FlowInstance } from '@activepieces/shared';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DeleteFlowDialogComponent } from './delete-flow-dialog/delete-flow-dialog.component';

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
  constructor(
    public dialogService: MatDialog,
    private store: Store,
    private router: Router,
    public collectionBuilderService: CollectionBuilderService,
    private route: ActivatedRoute,
    private snackbar: MatSnackBar
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
    this.dialogService.open(DeleteFlowDialogComponent, { data: flow });
  }
}

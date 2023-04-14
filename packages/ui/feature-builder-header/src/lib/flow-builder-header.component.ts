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
} from '@activepieces/ui/feature-builder-store';
import { FlowInstance } from '@/shared/src';

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

  constructor(
    public dialog: MatDialog,
    private store: Store,
    private router: Router,
    public collectionBuilderService: CollectionBuilderService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.instance$ = this.store.select(BuilderSelectors.selectCurrentInstance);
    this.viewMode$ = this.store.select(BuilderSelectors.selectReadOnly);
    this.magicWandEnabled$ = this.route.queryParams.pipe(
      map((params) => {
        return !!params['magicWand'];
      })
    );
  }

  guessAi() {
    this.dialog.open(MagicWandDialogComponent);
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
}

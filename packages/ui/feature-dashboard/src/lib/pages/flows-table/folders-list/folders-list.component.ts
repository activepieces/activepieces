import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NewFolderDialogComponent } from '../new-folder-dialog/new-folder-dialog.component';
import { Observable } from 'rxjs';
import { FoldersListDto } from '@activepieces/shared';
import { Store } from '@ngrx/store';
import { FoldersSelectors } from '../../../store/folders/folders.selector';
import { FolderActions } from '../../../store/folders/folders.actions';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-folders-list',
  templateUrl: './folders-list.component.html',
  styleUrls: ['./folders-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FoldersListComponent {
  allFlowsNumber$: Observable<number>;
  uncategorizedFlowsNumber$: Observable<number>;
  folders$: Observable<FoldersListDto[]>;
  selectedFolder$: Observable<FoldersListDto | undefined>;
  showAllFlows$: Observable<boolean>;
  constructor(
    private dialogService: MatDialog,
    private store: Store,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.folders$ = this.store.select(FoldersSelectors.selectFolders);
    this.allFlowsNumber$ = this.store.select(
      FoldersSelectors.selectAllFlowsNumber
    );
    this.uncategorizedFlowsNumber$ = this.store.select(
      FoldersSelectors.selectUncategorizedFlowsNumber
    );
    this.selectedFolder$ = this.store.select(
      FoldersSelectors.selectCurrentFolder
    );
    this.showAllFlows$ = this.store.select(
      FoldersSelectors.selectDisplayAllFlows
    );
  }
  createFolder() {
    this.dialogService.open(NewFolderDialogComponent);
  }
  setSelectedFolder(folderId: string) {
    this.store.dispatch(FolderActions.selectFolder({ folderId }));
    this.clearCursorParam(folderId);
  }
  showAllFlows() {
    this.store.dispatch(FolderActions.showAllFlows());
    this.clearCursorParam();
  }

  clearCursorParam(folderId?: string) {
    this.router.navigate(['.'], {
      relativeTo: this.route,
      queryParams: { cursor: undefined, folderId: folderId },
      queryParamsHandling: 'merge',
    });
  }
}

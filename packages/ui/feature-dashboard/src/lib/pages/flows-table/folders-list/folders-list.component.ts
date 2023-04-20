import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NewFolderDialogComponent } from '../new-folder-dialog/new-folder-dialog.component';
import { Observable, tap, map } from 'rxjs';
import { FoldersListDto } from '@activepieces/shared';
import { Store } from '@ngrx/store';
import { FoldersSelectors } from '../../../store/folders/folders.selector';
import { FolderActions } from '../../../store/folders/folders.actions';
import { ActivatedRoute, Router } from '@angular/router';
import { FoldersService } from '../../../services/folders.service';
import { DeleteEntityDialogComponent, DeleteEntityDialogData } from '../../../../../../common/src';
import { RenameFolderDialogComponent, RenameFolderDialogData } from '../rename-folder-dialog/rename-folder-dialog.component';

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
  createFolderDialogClosed$: Observable<void>;
  folderIdOfMenuOpened: string | undefined = undefined;
  constructor(
    private dialogService: MatDialog,
    private store: Store,
    private router: Router,
    private route: ActivatedRoute,
    private folderService: FoldersService
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
    const dialogRef = this.dialogService.open(NewFolderDialogComponent, {
      restoreFocus: false,
    });
    this.createFolderDialogClosed$ = dialogRef.afterClosed().pipe(
      tap((folderId: string) => {
        if (folderId) {
          this.clearCursorParam(folderId);
        }
      }),
      map(() => void 0)
    );
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
  deleteFolder(folder:FoldersListDto)
  {
    const dialogData: DeleteEntityDialogData = {
      deleteEntity$: this.folderService.delete(folder.id).pipe(tap(()=>{
        this.store.dispatch(FolderActions.deleteFolder({folderId:folder.id}));
        this.clearCursorParam()
      })),
      entityName:folder.displayName,
      note:"If you delete this folder, we will keep its flows and move them to Uncategorized."
    }
    this.dialogService.open(DeleteEntityDialogComponent,{data:dialogData})
  }
  renameFolder(folder:FoldersListDto)
  {
    const dialogData: RenameFolderDialogData = {
       folderId:folder.id
    }
    this.dialogService.open(RenameFolderDialogComponent,{data:dialogData})
  }
}

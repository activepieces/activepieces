import { ChangeDetectionStrategy, Component } from '@angular/core';
import { InstallCommunityPieceModalComponent } from './install-community-piece/install-community-piece-modal.component';
import { MatDialog } from '@angular/material/dialog';
import {
  BehaviorSubject,
  Observable,
  Subject,
  map,
  startWith,
  tap,
} from 'rxjs';
import {
  DeleteEntityDialogComponent,
  DeleteEntityDialogData,
  PieceMetadataService,
} from '@activepieces/ui/common';
import { PieceMetadataSummary } from '@activepieces/pieces-framework';
import { CommunityPiecesDataSource } from './community-pieces-table.datasource';

@Component({
  templateUrl: './community-pieces-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunityPiecesTableComponent {
  addPackageDialogClosed$: Observable<void>;
  displayedColumns = ['app', 'name', 'version', 'action'];
  deleteDialogClosed$: Observable<void>;
  isLoading$: BehaviorSubject<boolean> = new BehaviorSubject(true);
  refreshTable$: Subject<boolean> = new Subject();
  dataSource!: CommunityPiecesDataSource;
  constructor(
    private dialogService: MatDialog,
    private pieceMetadataService: PieceMetadataService
  ) {
    this.dataSource = new CommunityPiecesDataSource(
      this.pieceMetadataService,
      this.refreshTable$.asObservable().pipe(startWith(true))
    );
  }

  installPiece() {
    this.addPackageDialogClosed$ = this.dialogService
      .open(InstallCommunityPieceModalComponent)
      .afterClosed()
      .pipe(
        tap(() => {
          this.pieceMetadataService.clearCache();
          this.refreshTable$.next(true);
        })
      );
  }

  deleteMetadata(metadata: PieceMetadataSummary) {
    const dialogRef = this.dialogService.open(DeleteEntityDialogComponent, {
      data: {
        deleteEntity$: this.pieceMetadataService.delete(metadata.id!).pipe(
          tap(() => {
            this.pieceMetadataService.clearCache();
            this.refreshTable$.next(true);
          })
        ),
        entityName: metadata.name,
        note: `This will permanently delete the community piece, all steps using it will fail.`,
      } as DeleteEntityDialogData,
    });
    this.deleteDialogClosed$ = dialogRef.afterClosed().pipe(
      map(() => {
        return void 0;
      })
    );
  }
}

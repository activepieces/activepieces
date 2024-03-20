import { ChangeDetectionStrategy, Component } from '@angular/core';
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
  GenericSnackbarTemplateComponent,
} from '@activepieces/ui/common';
import { PieceMetadataSummary } from '@activepieces/pieces-framework';
import { CommunityPiecesDataSource } from './community-pieces-table.datasource';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InstallCommunityPieceModalComponent } from '../install-community-piece/install-community-piece-modal.component';
import { PieceScope } from '@activepieces/shared';
import { PieceMetadataService } from '../services/piece.service';

@Component({
  templateUrl: './community-pieces-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunityPiecesTableComponent {
  addPackageDialogClosed$!: Observable<Record<string, string> | null>;
  displayedColumns = ['app', 'name', 'version', 'action'];
  deleteDialogClosed$!: Observable<void>;
  isLoading$: BehaviorSubject<boolean> = new BehaviorSubject(true);
  refreshTable$: Subject<boolean> = new Subject();
  dataSource!: CommunityPiecesDataSource;
  constructor(
    private dialogService: MatDialog,
    private pieceMetadataService: PieceMetadataService,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new CommunityPiecesDataSource(
      this.pieceMetadataService,
      this.refreshTable$.asObservable().pipe(startWith(true))
    );
  }

  installPiece() {
    this.addPackageDialogClosed$ = this.dialogService
      .open(InstallCommunityPieceModalComponent, {
        data: {
          scope: PieceScope.PROJECT,
        },
      })
      .afterClosed()
      .pipe(
        tap((res) => {
          if (res) {
            this.pieceMetadataService.clearCache();
            this.refreshTable$.next(true);
          }
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
        note: `This will permanently delete this piece, all steps using it will fail.`,
      } as DeleteEntityDialogData,
    });
    this.deleteDialogClosed$ = dialogRef.afterClosed().pipe(
      map((res) => {
        if (res) {
          this.snackBar.openFromComponent(GenericSnackbarTemplateComponent, {
            data: `<b>${metadata.name}</b> deleted`,
          });
        }
        return void 0;
      })
    );
  }
}

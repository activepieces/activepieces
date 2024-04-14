import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, Observable, Subject, startWith, tap } from 'rxjs';
import { ProjectPiecesDataSource } from './project-pieces-table.datasource';
import { InstallCommunityPieceModalComponent } from '../install-community-piece/install-community-piece-modal.component';
import {
  ApFlagId,
  PieceScope,
  PieceType,
  ProjectMemberRole,
  isNil,
} from '@activepieces/shared';
import { PieceMetadataService } from '../services/piece.service';
import {
  DeleteEntityDialogComponent,
  DeleteEntityDialogData,
  FlagService,
  GenericSnackbarTemplateComponent,
} from '@activepieces/ui/common';
import { ManagePiecesDialogComponent } from '../manage-pieces-dialog/manage-pieces-dialog.component';
import {
  PieceMetadataModelSummary,
  PieceMetadataSummary,
} from '@activepieces/pieces-framework';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProjectMemberService } from 'ee-project-members';

@Component({
  templateUrl: './project-pieces-table.component.html',
  selector: 'ap-community-pieces-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectPiecesTableComponent {
  readonly permissionMessage = $localize` 'You don\'t have permissions to manage pieces'`;
  openDialog$!: Observable<Record<string, string> | null>;
  displayedColumns = ['app', 'displayName', 'name', 'version', 'action'];
  installPieceEnabled$: Observable<boolean>;
  managePiecesEnabled$: Observable<boolean>;
  isLoading$: BehaviorSubject<boolean> = new BehaviorSubject(true);
  refreshTable$: Subject<boolean> = new Subject();
  isAdmin$: Observable<boolean>;
  dataSource!: ProjectPiecesDataSource;

  constructor(
    private dialogService: MatDialog,
    private pieceMetadataService: PieceMetadataService,
    private snackBar: MatSnackBar,
    private flagService: FlagService,
    private projectMemberService: ProjectMemberService
  ) {
    this.dataSource = new ProjectPiecesDataSource(
      this.pieceMetadataService,
      this.refreshTable$.asObservable().pipe(startWith(true))
    );
    this.isAdmin$ = this.projectMemberService.isRole(ProjectMemberRole.ADMIN);
    this.installPieceEnabled$ = this.flagService.isFlagEnabled(
      ApFlagId.INSTALL_PROJECT_PIECES_ENABLED
    );
    this.managePiecesEnabled$ = this.flagService.isFlagEnabled(
      ApFlagId.MANAGE_PROJECT_PIECES_ENABLED
    );
  }

  managePieces() {
    this.openDialog$ = this.dialogService
      .open(ManagePiecesDialogComponent, {
        data: {
          pieces: this.dataSource.data.map((piece) => piece.name),
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
    this.openDialog$ = dialogRef.afterClosed().pipe(
      tap((res) => {
        if (res) {
          this.snackBar.openFromComponent(GenericSnackbarTemplateComponent, {
            data: `<b>${metadata.name}</b> deleted`,
          });
        }
      })
    );
  }

  installPiece() {
    this.openDialog$ = this.dialogService
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

  isInstalledPiece(piece: PieceMetadataModelSummary) {
    return piece.pieceType === PieceType.CUSTOM && !isNil(piece.projectId);
  }
}

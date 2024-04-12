import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { map, Observable, tap } from 'rxjs';
import {
  AppConnection,
  AppConnectionStatus,
  SeekPage,
} from '@activepieces/shared';
import {
  DeleteEntityDialogComponent,
  DeleteEntityDialogData,
} from '@activepieces/ui/common';
import { ConnectionsTableDataSource } from './connections-table.datasource';
import { ApPaginatorComponent } from '@activepieces/ui/common';
import { AppConnectionsService } from '@activepieces/ui/common';
import { PieceMetadataService } from '@activepieces/ui/feature-pieces';
import { NewConnectionDialogComponent } from '../../components/dialogs/new-connection-dialog/new-connection-dialog.component';
import { AddEditConnectionButtonComponent } from '@activepieces/ui/feature-connections';
import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';

@Component({
  templateUrl: './connections-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConnectionsTableComponent implements OnInit {
  @ViewChild(AddEditConnectionButtonComponent)
  createConnectionButton!: AddEditConnectionButtonComponent;
  @ViewChild(ApPaginatorComponent, { static: true })
  paginator!: ApPaginatorComponent;
  connectionPage$: Observable<SeekPage<AppConnection>>;
  dataSource!: ConnectionsTableDataSource;
  title = $localize`Connections`;
  newConnectionPiece?: PieceMetadataModelSummary;
  newConnectionDialogClosed$?: Observable<PieceMetadataModelSummary>;
  displayedColumns = ['app', 'name', 'status', 'created', 'updated', 'action'];
  deleteConnectionDialogClosed$?: Observable<void>;
  readonly AppConnectionStatus = AppConnectionStatus;
  constructor(
    private activatedRoute: ActivatedRoute,
    private pieceMetadataService: PieceMetadataService,
    private connectionService: AppConnectionsService,
    private dialogService: MatDialog
  ) {}

  ngOnInit(): void {
    this.dataSource = new ConnectionsTableDataSource(
      this.activatedRoute.queryParams,
      this.paginator,
      this.pieceMetadataService,
      this.connectionService
    );
  }

  deleteConnection(connection: AppConnection) {
    const dialogRef = this.dialogService.open(DeleteEntityDialogComponent, {
      data: {
        deleteEntity$: this.connectionService.delete(connection.id),
        entityName: connection.name,
        note: `This will permanently delete the connection, all steps using it will fail.
         You can't undo this action.`,
      } as DeleteEntityDialogData,
    });
    this.deleteConnectionDialogClosed$ = dialogRef.beforeClosed().pipe(
      map(() => {
        return void 0;
      })
    );
  }
  openNewConnectionDialog() {
    this.newConnectionDialogClosed$ = this.dialogService
      .open(NewConnectionDialogComponent)
      .afterClosed()
      .pipe(
        tap((piece: PieceMetadataModelSummary) => {
          this.newConnectionPiece = piece;
          setTimeout(() => {
            this.createConnectionButton.buttonClicked();
          });
        })
      );
  }
}

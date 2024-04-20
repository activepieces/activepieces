import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import {
  map,
  Observable,
  tap,
  Subject,
  startWith,
  distinctUntilChanged,
} from 'rxjs';
import {
  AppConnection,
  AppConnectionStatus,
  SeekPage,
} from '@activepieces/shared';
import { ConnectionsTableDataSource } from './connections-table.datasource';
import {
  DeleteEntityDialogComponent,
  DeleteEntityDialogData,
  ApPaginatorComponent,
  DATE_RANGE_END_QUERY_PARAM,
  DATE_RANGE_START_QUERY_PARAM,
  AppConnectionsService,
} from '@activepieces/ui/common';
import { PieceMetadataService } from '@activepieces/ui/feature-pieces';
import { NewConnectionDialogComponent } from '../../components/dialogs/new-connection-dialog/new-connection-dialog.component';
import { AddEditConnectionButtonComponent } from '@activepieces/ui/feature-connections';
import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { FormControl, FormGroup } from '@angular/forms';

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
  refreshTableForReruns$: Subject<boolean> = new Subject();
  title = $localize`Connections`;
  newConnectionPiece?: PieceMetadataModelSummary;
  newConnectionDialogClosed$?: Observable<PieceMetadataModelSummary>;
  displayedColumns = ['app', 'name', 'status', 'created', 'updated', 'action'];
  deleteConnectionDialogClosed$?: Observable<void>;
  readonly AppConnectionStatus = AppConnectionStatus;
  filtersChanged$: Observable<void>;
  dateFormGroup = new FormGroup({
    start: new FormControl(),
    end: new FormControl(),
  });
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private pieceMetadataService: PieceMetadataService,
    private connectionService: AppConnectionsService,
    private dialogService: MatDialog
  ) {
    const startDate = this.activatedRoute.snapshot.queryParamMap.get(
      DATE_RANGE_START_QUERY_PARAM
    );
    const endDate = this.activatedRoute.snapshot.queryParamMap.get(
      DATE_RANGE_END_QUERY_PARAM
    );
    this.dateFormGroup.setValue({
      start: startDate ? new Date(startDate) : null,
      end: endDate ? new Date(endDate) : null,
    });
  }

  ngOnInit(): void {
    this.filtersChanged$ = this.dateFormGroup.valueChanges.pipe(
      startWith(this.dateFormGroup.value),
      distinctUntilChanged(
        (prev, curr) => prev.start === curr.start && prev.end === curr.end
      ),
      tap((result) => {
        const createdAfter = result.start ? new Date(result.start) : undefined;
        const createdBefore = result.end ? new Date(result.end) : undefined;
        if (createdBefore) {
          createdBefore.setHours(23, 59, 59, 999);
        }
        this.router.navigate(['connections'], {
          queryParams: {
            createdAfter: createdAfter ? createdAfter.toISOString() : undefined,
            createdBefore: createdBefore
              ? createdBefore.toISOString()
              : undefined,
          },
          queryParamsHandling: 'merge',
        });
      }),
      map(() => undefined)
    );

    this.dataSource = new ConnectionsTableDataSource(
      this.activatedRoute.queryParams,
      this.paginator,
      this.pieceMetadataService,
      this.connectionService,
      this.refreshTableForReruns$.asObservable().pipe(startWith(true))
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

  handleOnChange(e: Event) {
    const event = e.target as HTMLInputElement;

    this.dataSource = new ConnectionsTableDataSource(
      this.activatedRoute.queryParams.pipe(
        map((res) => ({
          ...res,
          connectionName: event.value,
        }))
      ),
      this.paginator,
      this.pieceMetadataService,
      this.connectionService,
      this.refreshTableForReruns$.asObservable().pipe(startWith(true))
    );
  }
}

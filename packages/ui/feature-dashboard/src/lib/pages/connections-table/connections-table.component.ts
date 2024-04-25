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
  combineLatest,
  distinctUntilChanged,
  BehaviorSubject,
  debounceTime,
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
  CONNECTION_NAME_QUERY_PARAM,
  PIECE_NAME_QUERY_PARAM,
  AppConnectionsService,
} from '@activepieces/ui/common';
import { PieceMetadataService } from '@activepieces/ui/feature-pieces';
import { NewConnectionDialogComponent } from '../../components/dialogs/new-connection-dialog/new-connection-dialog.component';
import { AddEditConnectionButtonComponent } from '@activepieces/ui/feature-connections';
import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { FormControl } from '@angular/forms';

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
  connectionNameFilterControl: FormControl<string | null> = new FormControl(
    null
  );
  pieceNameFilterControl: FormControl<string | null> = new FormControl(null);
  pieces$: Observable<PieceMetadataModelSummary[]>;
  allPieces: BehaviorSubject<string[] | undefined> = new BehaviorSubject<
    string[] | undefined
  >(undefined);
  searchControl: FormControl<string> = new FormControl<string>('', {
    nonNullable: true,
  });
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private pieceMetadataService: PieceMetadataService,
    private connectionService: AppConnectionsService,
    private dialogService: MatDialog
  ) {
    this.connectionNameFilterControl.setValue(
      this.activatedRoute.snapshot.queryParamMap.get(
        CONNECTION_NAME_QUERY_PARAM
      )
    );
    this.pieceNameFilterControl.setValue(
      this.activatedRoute.snapshot.queryParamMap.get(PIECE_NAME_QUERY_PARAM)
    );
    const allPieces$ = this.pieceMetadataService.listPieces({
      includeHidden: true,
    });
    this.pieces$ = combineLatest([
      allPieces$,
      this.searchControl.valueChanges.pipe(
        startWith(''),
        debounceTime(100),
        distinctUntilChanged()
      ),
    ]).pipe(
      map(([pieces, search]) => {
        this.allPieces.next(pieces.map((piece) => piece.name));
        return pieces.filter((piece) =>
          piece.displayName.toLowerCase().includes(search.toLowerCase())
        );
      })
    );
  }

  ngOnInit(): void {
    this.filtersChanged$ = combineLatest({
      connectionName: this.connectionNameFilterControl.valueChanges.pipe(
        startWith(this.connectionNameFilterControl.value)
      ),
      pieceName: this.pieceNameFilterControl.valueChanges.pipe(
        startWith(this.pieceNameFilterControl.value)
      ),
    }).pipe(
      distinctUntilChanged(),
      tap((result) => {
        this.router.navigate(['connections'], {
          queryParams: {
            name: result.connectionName,
            pieceName: result.pieceName,
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
}

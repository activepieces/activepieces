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
  of,
} from 'rxjs';
import {
  AppConnection,
  AppConnectionStatus,
  Permission,
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
  TableCore,
  unpermittedTooltip,
  CONNECTION_STATUS_QUERY_PARAM,
  FilterConfig,
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
export class ConnectionsTableComponent extends TableCore implements OnInit {
  @ViewChild(AddEditConnectionButtonComponent)
  createConnectionButton!: AddEditConnectionButtonComponent;
  @ViewChild(ApPaginatorComponent, { static: true })
  paginator!: ApPaginatorComponent;
  connectionPage$: Observable<SeekPage<AppConnection>>;
  dataSource!: ConnectionsTableDataSource;
  refreshTableForReruns$: Subject<boolean> = new Subject();
  title = $localize`Connections`;
  isReadOnly = !this.hasPermission(Permission.WRITE_APP_CONNECTION);
  readonly unpermittedTooltip = unpermittedTooltip;
  readonly deleteConnectionTooltip = this.isReadOnly
    ? unpermittedTooltip
    : $localize`Delete Connection`;
  newConnectionPiece?: PieceMetadataModelSummary;
  newConnectionDialogClosed$?: Observable<PieceMetadataModelSummary>;
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
  statusFilterControl: FormControl<string | null> = new FormControl(null);
  selectedFilters: string[] = [];
  filters: FilterConfig<
    PieceMetadataModelSummary | { label: string; value: AppConnectionStatus },
    string
  >[];
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private pieceMetadataService: PieceMetadataService,
    private connectionService: AppConnectionsService,
    private dialogService: MatDialog
  ) {
    super({
      tableColumns: ['app', 'name', 'status', 'created', 'updated', 'action'],
    });
    this.connectionNameFilterControl.setValue(
      this.activatedRoute.snapshot.queryParamMap.get(
        CONNECTION_NAME_QUERY_PARAM
      )
    );
    this.pieceNameFilterControl.setValue(
      this.activatedRoute.snapshot.queryParamMap.get(PIECE_NAME_QUERY_PARAM)
    );
    this.statusFilterControl.setValue(
      this.activatedRoute.snapshot.queryParamMap.get(
        CONNECTION_STATUS_QUERY_PARAM
      )
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
    this.filters = [
      {
        type: 'text',
        name: 'By Name',
        label: 'Filter by Name',
        formControl: this.connectionNameFilterControl,
        queryParam: CONNECTION_NAME_QUERY_PARAM,
      },
      {
        type: 'select',
        name: 'By Piece',
        label: 'Filter by Piece',
        formControl: this.pieceNameFilterControl,
        searchControl: this.searchControl,
        options$: this.pieces$,
        allValues$: this.allPieces.asObservable(),
        optionLabelKey: 'displayName',
        optionValueKey: 'name',
        queryParam: PIECE_NAME_QUERY_PARAM,
      },
      {
        type: 'select',
        name: 'By Status',
        label: 'Filter by Status',
        formControl: this.statusFilterControl,
        options$: of([
          { label: 'Active', value: AppConnectionStatus.ACTIVE },
          { label: 'Inactive', value: AppConnectionStatus.ERROR },
        ]),
        allValues$: of([AppConnectionStatus.ACTIVE, AppConnectionStatus.ERROR]),
        optionLabelKey: 'label',
        optionValueKey: 'value',
        queryParam: CONNECTION_STATUS_QUERY_PARAM,
      },
    ];
  }

  ngOnInit(): void {
    this.filtersChanged$ = combineLatest({
      connectionName: this.connectionNameFilterControl.valueChanges.pipe(
        startWith(this.connectionNameFilterControl.value)
      ),
      pieceName: this.pieceNameFilterControl.valueChanges.pipe(
        startWith(this.pieceNameFilterControl.value)
      ),
      connectionStatus: this.statusFilterControl.valueChanges.pipe(
        startWith(this.statusFilterControl.value)
      ),
    }).pipe(
      distinctUntilChanged(),
      tap((result) => {
        this.router.navigate(['connections'], {
          queryParams: {
            name: result.connectionName,
            pieceName: result.pieceName,
            connectionStatus: result.connectionStatus,
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

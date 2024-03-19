import { DataSource } from '@angular/cdk/collections';
import {
  Observable,
  BehaviorSubject,
  tap,
  switchMap,
  map,
  combineLatest,
  of,
  shareReplay,
} from 'rxjs';
import {
  OAuth2AppsService,
  PieceMetadataModelSummary,
} from '@activepieces/ui/common';
import { PieceMetadataService } from '@activepieces/ui/feature-pieces';

/**
 * Data source for the LogsTable view. This class should
 * encapsulate all logic for fetching and manipulating the displayed data
 * (including sorting, pagination, and filtering).
 */
export type ManagedPieceMetadataModelSummary = PieceMetadataModelSummary & {
  oauth2AppCredentialsId?: string;
};
export class PiecesTableDataSource extends DataSource<ManagedPieceMetadataModelSummary> {
  data: ManagedPieceMetadataModelSummary[] = [];
  isLoading$: BehaviorSubject<boolean> = new BehaviorSubject(true);
  pieces$: Observable<PieceMetadataModelSummary[]>;
  constructor(
    private piecesService: PieceMetadataService,
    private searchControlValueChanged$: Observable<string>,
    private oAuth2AppsService: OAuth2AppsService,
    private refresh$: Observable<true>,
    private withoutOAuth2Cred: boolean
  ) {
    super();
    this.pieces$ = this.piecesService.listPieces({
      includeHidden: true,
    }).pipe(shareReplay(1));
  }

  /**
   * Connect this data source to the table. The table will only update when
   * the returned stream emits new items.
   * @returns A stream of the items to be rendered.
   */

  connect(): Observable<ManagedPieceMetadataModelSummary[]> {
    this.isLoading$.next(true);
    return combineLatest({
      refresh: this.refresh$,
      search: this.searchControlValueChanged$,
    }).pipe(
      tap(() => {
        this.isLoading$.next(true);
      }),
      switchMap(({ search }) => {
        return this.pieces$.pipe(
          map((ps) => {
            if (search) {
              return ps.filter((p) =>
                p.displayName.toLowerCase().includes(search.toLowerCase())
              );
            }
            return ps;
          })
        );
      }),
      switchMap((pieces) => {
        if (this.withoutOAuth2Cred) {
          return of(pieces);
        }

        return this.oAuth2AppsService.listOAuth2AppsCredentials().pipe(
          map((apps) => {
            return pieces.map((p) => {
              const appCredentials = apps.data.find(
                (a) => a.pieceName === p.name
              );
              return {
                ...p,
                oauth2AppCredentialsId: appCredentials?.id,
              };
            });
          })
        );
      }),
      tap((res) => {
        this.data = res;
        this.isLoading$.next(false);
      })
    );
  }

  /**
   *  Called when the table is being destroyed. Use this function, to clean up
   * any open connections or free any held resources that were set up during connect.
   */
  disconnect(): void {
    //ignore
  }
}

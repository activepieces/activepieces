import { DataSource } from '@angular/cdk/collections';
import {
  Observable,
  BehaviorSubject,
  tap,
  shareReplay,
  switchMap,
  map,
} from 'rxjs';
import {
  PieceMetadataModelSummary,
  PieceMetadataService,
} from '@activepieces/ui/common';

/**
 * Data source for the LogsTable view. This class should
 * encapsulate all logic for fetching and manipulating the displayed data
 * (including sorting, pagination, and filtering).
 */
export class PiecesTableDataSource extends DataSource<PieceMetadataModelSummary> {
  data: PieceMetadataModelSummary[] = [];
  isLoading$: BehaviorSubject<boolean> = new BehaviorSubject(true);
  pieces$: Observable<PieceMetadataModelSummary[]>;
  constructor(
    private piecesService: PieceMetadataService,
    private searchControlValueChanged$: Observable<string>
  ) {
    super();
    this.pieces$ = this.piecesService
      .getPiecesMetadataIncludeHidden({
        includeHidden: true,
      })
      .pipe(shareReplay(1));
  }

  /**
   * Connect this data source to the table. The table will only update when
   * the returned stream emits new items.
   * @returns A stream of the items to be rendered.
   */

  connect(): Observable<PieceMetadataModelSummary[]> {
    this.isLoading$.next(true);
    return this.searchControlValueChanged$.pipe(
      tap(() => {
        this.isLoading$.next(true);
      }),
      switchMap((search) => {
        return this.pieces$.pipe(
          map((ps) => {
            if (search) {
              return ps.filter((p) =>
                p.displayName.toLowerCase().startsWith(search.toLowerCase())
              );
            }
            return ps;
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

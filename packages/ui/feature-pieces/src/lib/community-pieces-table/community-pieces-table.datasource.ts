import { DataSource } from '@angular/cdk/collections';
import { Observable, BehaviorSubject, tap, switchMap, delay } from 'rxjs';
import { combineLatest } from 'rxjs';
import { PieceMetadataService } from '../services/piece-meta.service';
import { PieceMetadataModelSummary } from '@activepieces/ui/common';

/**
 * Data source for the LogsTable view. This class should
 * encapsulate all logic for fetching and manipulating the displayed data
 * (including sorting, pagination, and filtering).
 */
export class CommunityPiecesDataSource extends DataSource<PieceMetadataModelSummary> {
  data: PieceMetadataModelSummary[] = [];
  isLoading$: BehaviorSubject<boolean> = new BehaviorSubject(true);
  constructor(
    private pieceMetadataService: PieceMetadataService,
    private refresh$: Observable<boolean>
  ) {
    super();
  }

  /**
   * Connect this data source to the table. The table will only update when
   * the returned stream emits new items.
   * @returns A stream of the items to be rendered.
   */

  connect(): Observable<PieceMetadataModelSummary[]> {
    return combineLatest([this.refresh$]).pipe(
      tap(() => {
        this.isLoading$.next(true);
      }),
      switchMap(() => this.pieceMetadataService.getCommunityPieces()),
      delay(100),
      tap((pieces) => {
        this.data = pieces;
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

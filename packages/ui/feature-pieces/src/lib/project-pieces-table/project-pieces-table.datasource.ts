import { DataSource } from '@angular/cdk/collections';
import { Observable, BehaviorSubject, tap, switchMap } from 'rxjs';
import { PieceMetadataSummary } from '@activepieces/pieces-framework';
import { combineLatest } from 'rxjs';
import { PieceMetadataService } from '../services/piece.service';

export class ProjectPiecesDataSource extends DataSource<PieceMetadataSummary> {
  data: PieceMetadataSummary[] = [];
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

  connect(): Observable<PieceMetadataSummary[]> {
    return combineLatest([this.refresh$]).pipe(
      tap(() => {
        this.isLoading$.next(true);
      }),
      switchMap(() => this.pieceMetadataService.listPieces({
        includeHidden: false,
      })),
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

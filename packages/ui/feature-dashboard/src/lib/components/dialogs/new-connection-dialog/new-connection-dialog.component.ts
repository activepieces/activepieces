import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { PieceMetadataService } from '@activepieces/ui/feature-pieces';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import {
  BehaviorSubject,
  Observable,
  map,
  shareReplay,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
@Component({
  selector: 'app-new-connection-dialog',
  templateUrl: './new-connection-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewConnectionDialogComponent {
  searchControl = new FormControl<string>('', { nonNullable: true });
  pieces$: Observable<PieceMetadataModelSummary[]>;
  loading$ = new BehaviorSubject<boolean>(false);
  constructor(
    private piecesService: PieceMetadataService,
    private dialogRef: MatDialogRef<NewConnectionDialogComponent>
  ) {
    this.pieces$ = this.searchControl.valueChanges.pipe(
      startWith(''),
      tap(() => {
        this.loading$.next(true);
      }),
      switchMap((searchQuery) => {
        return this.piecesService.listPieces({
          includeHidden: false,
          searchQuery,
        });
      }),
      map((pieces) => {
        return pieces.filter((p) => !!p.auth);
      }),
      tap(() => {
        this.loading$.next(false);
      }),
      shareReplay(1)
    );
  }

  openCreateConnectionDialog(piece: PieceMetadataModelSummary) {
    this.dialogRef.close(piece);
  }
}

import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import {
  MonoTypeOperatorFunction,
  Observable,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import {
  AuthenticationService,
  PieceMetadataModelSummary,
  PieceMetadataService,
} from '@activepieces/ui/common';
import { Platform } from '@activepieces/ee-shared';
import { ActivatedRoute } from '@angular/router';
import { PlatformService } from '../../platform.service';

@Component({
  selector: 'app-pieces-table',
  templateUrl: './pieces-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PiecesTableComponent implements OnInit {
  title = $localize`Pieces`;
  saving$?: Observable<void>;
  platform!: Platform;
  status$: Subject<'Saved' | 'Saving'> = new Subject();
  pieces$: Observable<PieceMetadataModelSummary[]>;
  constructor(
    private authenticationService: AuthenticationService,
    private piecesService: PieceMetadataService,
    private route: ActivatedRoute,
    private platformService: PlatformService
  ) {
    this.authenticationService.getPlatformId();
    this.pieces$ = this.piecesService.getAllPiecesMetadata();
  }
  ngOnInit(): void {
    this.platform = this.route.snapshot.data['platform'];
  }

  togglePiece(piece: PieceMetadataModelSummary) {
    const pieceIncluded = !!this.platform.filteredPieceNames.find(
      (pn) => pn === piece.name
    );
    if (pieceIncluded) {
      const newPiecesList = this.platform.filteredPieceNames.filter(
        (pn) => pn !== piece.name
      );
      this.platform = { ...this.platform, filteredPieceNames: newPiecesList };
    } else {
      this.platform = {
        ...this.platform,
        filteredPieceNames: [...this.platform.filteredPieceNames, piece.name],
      };
    }
    this.status$.next('Saving');
    const finishedSavingPipe: MonoTypeOperatorFunction<void> = tap(() =>
      this.status$.next('Saved')
    );
    if (this.saving$) {
      this.saving$ = this.saving$.pipe(
        switchMap(() => {
          return this.savePlatform(this.platform);
        }),
        finishedSavingPipe
      );
    } else {
      this.saving$ = this.savePlatform(this.platform).pipe(finishedSavingPipe);
    }
  }
  savePlatform(platform: Platform) {
    return this.platformService.updatePlatform(platform, platform.id);
  }
}

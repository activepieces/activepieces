import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import {
  BehaviorSubject,
  MonoTypeOperatorFunction,
  Observable,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import {
  AuthenticationService,
  PieceMetadataModelSummary,
  PieceMetadataService,
  PlatformService,
} from '@activepieces/ui/common';
import { Platform } from '@activepieces/ee-shared';
import { ActivatedRoute } from '@angular/router';
import { PiecesTableDataSource } from './pieces-table.datasource';
import { FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-pieces-table',
  templateUrl: './pieces-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PiecesTableComponent implements OnInit {
  displayedColumns = ['displayName', 'action'];
  title = $localize`Pieces`;
  saving$?: Observable<void>;
  platform$!: BehaviorSubject<Platform>;
  readonly pieceShownText = $localize`is now available to users`;
  readonly pieceHiddenText = $localize`is now hidden from users`;
  readonly showPieceTooltip = $localize`Show this piece to users`;
  readonly hidePieceTooltip = $localize`Hide this piece from users`;
  searchFormControl = new FormControl('', { nonNullable: true });
  dataSource!: PiecesTableDataSource;
  constructor(
    private authenticationService: AuthenticationService,
    private piecesService: PieceMetadataService,
    private route: ActivatedRoute,
    private platformService: PlatformService,
    private matSnackbar: MatSnackBar
  ) {
    this.authenticationService.getPlatformId();
  }
  ngOnInit(): void {
    this.platform$ = new BehaviorSubject(this.route.snapshot.data['platform']);
    this.dataSource = new PiecesTableDataSource(
      this.piecesService,
      this.searchFormControl.valueChanges.pipe(startWith(''))
    );
  }

  togglePiece(piece: PieceMetadataModelSummary) {
    const pieceIncluded = !!this.platform$.value.filteredPieceNames.find(
      (pn) => pn === piece.name
    );
    if (pieceIncluded) {
      const newPiecesList = this.platform$.value.filteredPieceNames.filter(
        (pn) => pn !== piece.name
      );
      this.platform$.next({
        ...this.platform$.value,
        filteredPieceNames: newPiecesList,
      });
    } else {
      this.platform$.next({
        ...this.platform$.value,
        filteredPieceNames: [
          ...this.platform$.value.filteredPieceNames,
          piece.name,
        ],
      });
    }

    const finishedSavingPipe: MonoTypeOperatorFunction<void> = tap(() => {
      this.matSnackbar.open(
        `${piece.displayName} ${
          pieceIncluded ? this.pieceShownText : this.pieceHiddenText
        }`
      );
    });
    if (this.saving$) {
      this.saving$ = this.saving$.pipe(
        switchMap(() => {
          return this.savePlatform(this.platform$.value);
        }),
        finishedSavingPipe
      );
    } else {
      this.saving$ = this.savePlatform(this.platform$.value).pipe(
        finishedSavingPipe
      );
    }
  }
  savePlatform(platform: Platform) {
    return this.platformService.updatePlatform(platform, platform.id);
  }
}

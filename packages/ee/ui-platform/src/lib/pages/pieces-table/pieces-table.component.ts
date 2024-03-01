import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import {
  BehaviorSubject,
  MonoTypeOperatorFunction,
  Observable,
  Subject,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import {
  DeleteEntityDialogComponent,
  DeleteEntityDialogData,
  OAuth2AppsService,
  PlatformService,
  featureDisabledTooltip,
} from '@activepieces/ui/common';
import { Platform } from '@activepieces/shared';
import { ActivatedRoute } from '@angular/router';
import {
  ManagedPieceMetadataModelSummary,
  PiecesTableDataSource,
} from './pieces-table.datasource';
import { FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PropertyType } from '@activepieces/pieces-framework';
import {
  EditAddPieceOAuth2CredentialsDialogComponent,
  PieceOAuth2CredentialsDialogData,
} from '../../components/dialogs/edit-add-piece-oauth-2-credentials-dialog/edit-add-piece-oauth-2-credentials-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import {
  InstallCommunityPieceModalComponent,
  PieceMetadataService,
} from '@activepieces/ui/feature-pieces';
import { PLATFORM_RESOLVER_KEY } from '../../platform.resolver';
import { PLATFORM_DEMO_RESOLVER_KEY } from '../../is-platform-demo.resolver';
import { PieceScope } from '@activepieces/shared';

@Component({
  selector: 'app-pieces-table',
  templateUrl: './pieces-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PiecesTableComponent implements OnInit {
  displayedColumns = ['displayName', 'packageName', 'version', 'action'];
  title = $localize`Pieces`;
  upgradeNote = $localize`Add pieces to your platform, configure them and manage their visibility to users.`;
  saving$?: Observable<void>;
  platform$?: BehaviorSubject<Platform>;
  readonly pieceShownText = $localize`is now available to users`;
  readonly pieceHiddenText = $localize`is now hidden from users`;
  readonly showPieceTooltip = $localize`Show this piece to users`;
  readonly hidePieceTooltip = $localize`Hide this piece from users`;
  readonly addPieceCredentialsTooltip = $localize`Add your own OAuth2 app`;
  readonly updatePieceCredentialsTooltip = $localize`Update your own OAuth2 app`;
  readonly deletePieceCredentialsTooltip = $localize`Delete your own OAuth2 app`;
  readonly OAUTH2 = PropertyType.OAUTH2;
  searchFormControl = new FormControl('', { nonNullable: true });
  dataSource!: PiecesTableDataSource;
  refresh$: Subject<true> = new Subject();
  dialogClosed$?: Observable<boolean>;
  addPackageDialogClosed$!: Observable<Record<string, string> | null>;
  cloudAuthToggleFormControl = new FormControl(false, { nonNullable: true });
  toggelCloudOAuth2$?: Observable<void>;
  featDisabledTooltipText = featureDisabledTooltip;
  isDemo = false;
  constructor(
    private piecesService: PieceMetadataService,
    private route: ActivatedRoute,
    private platformService: PlatformService,
    private matSnackbar: MatSnackBar,
    private matDialog: MatDialog,
    private oauth2AppsService: OAuth2AppsService
  ) {}
  ngOnInit(): void {
    const platform: Platform | undefined =
      this.route.snapshot.data[PLATFORM_RESOLVER_KEY];
    this.isDemo = this.route.snapshot.data[PLATFORM_DEMO_RESOLVER_KEY];
    if (platform) {
      this.platform$ = new BehaviorSubject(platform);
    }
    this.toggelCloudOAuth2$ = this.getCloudOAuth2ToggleListener();

    this.dataSource = new PiecesTableDataSource(
      this.piecesService,
      this.searchFormControl.valueChanges.pipe(startWith('')),
      this.oauth2AppsService,
      this.refresh$.asObservable().pipe(startWith(true as const)),
      this.isDemo
    );
    if (this.isDemo) {
      this.cloudAuthToggleFormControl.disable();
    } else if (this.platform$) {
      this.cloudAuthToggleFormControl.setValue(
        this.platform$.value.cloudAuthEnabled
      );
    }
  }

  getCloudOAuth2ToggleListener() {
    if (!this.platform$) {
      return undefined;
    }
    return this.cloudAuthToggleFormControl.valueChanges.pipe(
      tap((cloudAuthEnabled) => {
        this.platform$!.next({ ...this.platform$!.value, cloudAuthEnabled });
      }),
      switchMap((cloudAuthEnabled) => {
        return this.platformService.updatePlatform(
          {
            ...this.platform$!.value,
            cloudAuthEnabled,
          },
          this.platform$!.value.id
        );
      })
    );
  }

  togglePiece(piece: ManagedPieceMetadataModelSummary) {
    if (!this.platform$) return;

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
          return this.saveFilteredPieces(this.platform$!.value);
        }),
        finishedSavingPipe
      );
    } else {
      this.saving$ = this.saveFilteredPieces(this.platform$.value).pipe(
        finishedSavingPipe
      );
    }
  }

  installPiece() {
    if (!this.platform$) return;
    this.addPackageDialogClosed$ = this.matDialog
      .open(InstallCommunityPieceModalComponent, {
        data: {
          scope: PieceScope.PLATFORM,
        },
      })
      .afterClosed()
      .pipe(
        tap((res) => {
          if (res) {
            this.piecesService.clearCache();
            this.refresh$.next(true);
          }
        })
      );
  }

  saveFilteredPieces(platform: Platform) {
    return this.platformService.updatePlatform(
      {
        filteredPieceNames: platform.filteredPieceNames,
      },
      platform.id
    );
  }

  openPieceOAuth2CredentialsDialog(
    isEditing: boolean,
    piece: ManagedPieceMetadataModelSummary
  ) {
    const data: PieceOAuth2CredentialsDialogData = {
      isEditing,
      pieceDisplayName: piece.displayName,
      pieceName: piece.name,
    };
    const dialog = this.matDialog.open(
      EditAddPieceOAuth2CredentialsDialogComponent,
      {
        data,
      }
    );
    this.dialogClosed$ = dialog.beforeClosed().pipe(
      tap((res) => {
        if (res) {
          this.refresh$.next(true);
        }
      })
    );
  }

  deletePieceOAuth2Creds(piece: ManagedPieceMetadataModelSummary) {
    if (piece.oauth2AppCredentialsId) {
      const data: DeleteEntityDialogData = {
        entityName: `${piece.displayName}` + $localize` OAuth2 app credentials`,
        note: $localize`all connections depending on these credentials will fail after deleting`,
        deleteEntity$: this.oauth2AppsService
          .deleteOAuth2AppCredentials(piece.oauth2AppCredentialsId)
          .pipe(tap(() => this.refresh$.next(true))),
      };
      this.matDialog.open(DeleteEntityDialogComponent, { data });
    }
  }
}

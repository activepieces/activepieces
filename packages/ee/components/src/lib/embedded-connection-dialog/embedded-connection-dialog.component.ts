import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AddEditConnectionButtonComponent,
  UiFeatureConnectionsModule,
} from '@activepieces/ui/feature-connections';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ActivatedRoute } from '@angular/router';
import { PieceMetadataService } from '@activepieces/ui/feature-pieces';
import {
  ActivepiecesClientEventName,
  ActivepiecesNewConnectionDialogClosed,
  NEW_CONNECTION_QUERY_PARAMS,
} from '@activepieces/ee-embed-sdk';
import { Observable, catchError, of, switchMap, tap } from 'rxjs';
import { PieceMetadataModel } from '@activepieces/ui/common';

@Component({
  selector: 'ap-embedded-connection-dialog',
  standalone: true,
  imports: [CommonModule, UiFeatureConnectionsModule, AngularSvgIconModule],
  templateUrl: './embedded-connection-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmbeddedConnectionDialogComponent {
  isDialogOpen = false;
  @ViewChild(AddEditConnectionButtonComponent)
  createConnectionButton!: AddEditConnectionButtonComponent;
  openNewConnectionsDialog$?: Observable<PieceMetadataModel | undefined>;
  constructor(
    private activatedRoute: ActivatedRoute,
    private pieceMetadataService: PieceMetadataService
  ) {
    this.openNewConnectionsDialog$ = this.activatedRoute.queryParams.pipe(
      switchMap((params) => {
        const pieceName = params[NEW_CONNECTION_QUERY_PARAMS.name];
        if (!pieceName) {
          console.error(
            `Activepieces: pieceName and pieceVersion are required query parameters`
          );
          this.hideConnectionIframe();
          return of(void 0);
        }
        return this.pieceMetadataService
          .getPieceMetadata(pieceName, undefined)
          .pipe(
            tap(() => {
              setTimeout(() => {
                this.createConnectionButton.buttonClicked();
                this.isDialogOpen = true;
              });
            }),
            catchError((err) => {
              console.error(
                `Activepieces: Failed to fetch piece metadata for ${pieceName}`,
                err
              );
              this.hideConnectionIframe();
              return of(void 0);
            })
          );
      })
    );
  }
  hideConnectionIframe(
    connection?: ActivepiecesNewConnectionDialogClosed['data']['connection']
  ) {
    if (this.isDialogOpen) {
      this.isDialogOpen = false;
      const newConnectionDialogClosedEvent: ActivepiecesNewConnectionDialogClosed =
        {
          data: {
            connection,
          },
          type: ActivepiecesClientEventName.CLIENT_NEW_CONNECTION_DIALOG_CLOSED,
        };
      window.parent.postMessage(newConnectionDialogClosedEvent, '*');
    }
  }
}

import { ApiKeyAppConnection, AppConnection, AppConnectionType } from '@activepieces/shared';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { map, Observable, switchMap, take, tap } from 'rxjs';
import { CloudOAuth2ConnectionDialogComponent } from '../../../../flow-builder/page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/piece-input-forms/cloud-oauth2-connection-dialog/cloud-oauth2-connection-dialog.component';
import { OAuth2ConnectionDialogComponent } from '../../../../flow-builder/page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/piece-input-forms/oauth2-connection-dialog/oauth2-connection-dialog.component';
import { SecretTextConnectionDialogComponent, SecretTextConnectionDialogData } from '../../../../flow-builder/page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/piece-input-forms/secret-text-connection-dialog/secret-text-connection-dialog.component';
import { BuilderSelectors } from '../../../../flow-builder/store/builder/builder.selector';
import { CloudAuthConfigsService } from '../../../service/cloud-auth-configs.service';
import { PieceConfig, PropertyType } from '../connector-action-or-config';

@Component({
  selector: 'app-add-edit-connection-button',
  templateUrl: './add-edit-connection-button.component.html',
  styleUrls: ['./add-edit-connection-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEditConnectionButtonComponent {
  @Input()
  btnSize: 'extraSmall' | 'small' | 'medium' | 'large' | 'default';
  checkingOAuth2CloudManager = false;
  @Input()
  config: PieceConfig;
  @Input()
  selectedConnectionInterpolatedString: string;
  @Input()
  pieceName: string;
  updateOrAddConnectionDialogClosed$: Observable<void>;
  updateAuthConfig$: Observable<void>;
  constructor(private store: Store, private dialogService: MatDialog, private cloudAuthConfigsService: CloudAuthConfigsService) { }

  editConnection() {
    const allConnections$ = this.store.select(
      BuilderSelectors.selectAllAppConnections
    );
    const currentConnection$ = allConnections$.pipe(
      take(1),
      map((connections) => {
        const connection = connections.find(
          (c) =>
            c.name ===
            this.getConnectionNameFromInterpolatedString(this.selectedConnectionInterpolatedString)
        );
        return connection!;
      }));
    if (this.config.type === PropertyType.OAUTH2) {
      this.editOAuth2Property(currentConnection$);
    }
    else {
      this.editSecretKeyConnection(currentConnection$);
    }

  }

  private editSecretKeyConnection(currentConnection$: Observable<AppConnection>) {
    this.updateOrAddConnectionDialogClosed$ = currentConnection$.pipe(switchMap(connection => {
      const secretKeyConnection = connection as ApiKeyAppConnection;
      const dialogData: SecretTextConnectionDialogData = {
        pieceName: this.pieceName,
        displayName: this.config.label,
        description: this.config.description || '',
        connectionName: connection!.name,
        secretText: secretKeyConnection!.value.secret_text
      };
      return this.dialogService
        .open(SecretTextConnectionDialogComponent, {
          data: dialogData,
        })
        .afterClosed();
    }));
  }

  private editOAuth2Property(currentConnection$: Observable<AppConnection>) {
    this.updateAuthConfig$ = currentConnection$.pipe(
      tap((connection) => {
        if (connection.value.type === AppConnectionType.OAUTH2) {
          this.updateOrAddConnectionDialogClosed$ = this.dialogService
            .open(OAuth2ConnectionDialogComponent, {
              data: {
                connectionToUpdate: connection,
                pieceAuthConfig: this.config,
                pieceName: this.pieceName,
              },
            })
            .afterClosed()
            .pipe(map(() => void 0));
        } else {
          if (!this.checkingOAuth2CloudManager) {
            this.checkingOAuth2CloudManager = true;
            this.updateOrAddConnectionDialogClosed$ =
              this.cloudAuthConfigsService.getAppsAndTheirClientIds().pipe(
                tap(() => {
                  this.checkingOAuth2CloudManager = false;
                }),
                switchMap((res) => {
                  const clientId = res[this.pieceName].clientId;
                  return this.dialogService
                    .open(CloudOAuth2ConnectionDialogComponent, {
                      data: {
                        connectionToUpdate: connection,
                        pieceAuthConfig: this.config,
                        pieceName: this.pieceName,
                        clientId: clientId,
                      },
                    })
                    .afterClosed()
                    .pipe(map(() => void 0));
                })
              );
          }
        }

      }),
      map(() => void 0)
    );
  }

  getConnectionNameFromInterpolatedString(interpolatedString: string) {
    //eg. ${connections.google}
    const result = interpolatedString.split('${connections.')[1];
    return result.slice(0, result.length - 1);
  }
}

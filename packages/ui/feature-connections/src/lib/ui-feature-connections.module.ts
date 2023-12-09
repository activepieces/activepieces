import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCommonModule } from '@activepieces/ui/common';
import { BasicAuthConnectionDialogComponent } from './dialogs/basic-auth-connection-dialog/basic-auth-connection-dialog.component';
import { ManagedOAuth2ConnectionDialogComponent } from './dialogs/managed-oauth2-connection-dialog/managed-oauth2-connection-dialog.component';
import { OAuth2ConnectControlComponent } from './form-controls/o-auth2-connect-control/o-auth2-connect-control.component';
import { CustomAuthConnectionDialogComponent } from './dialogs/custom-auth-connection-dialog/custom-auth-connection-dialog.component';
import { OAuth2ConnectionDialogComponent } from './dialogs/oauth2-connection-dialog/oauth2-connection-dialog.component';
import { SecretTextConnectionDialogComponent } from './dialogs/secret-text-connection-dialog/secret-text-connection-dialog.component';
import { AddEditConnectionButtonComponent } from './add-edit-connection-button/add-edit-connection-button.component';
@NgModule({
  imports: [CommonModule, UiCommonModule],
  declarations: [
    BasicAuthConnectionDialogComponent,
    ManagedOAuth2ConnectionDialogComponent,
    OAuth2ConnectControlComponent,
    CustomAuthConnectionDialogComponent,
    OAuth2ConnectionDialogComponent,
    SecretTextConnectionDialogComponent,
    AddEditConnectionButtonComponent,
  ],
  exports: [AddEditConnectionButtonComponent],
})
export class UiFeatureConnectionsModule {}

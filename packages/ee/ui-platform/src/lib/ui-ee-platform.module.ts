import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { uiEePlatformRoutes } from './lib.routes';
import { UiCommonModule } from '@activepieces/ui/common';
import { PlatformDashboardContainerComponent } from './pages/platform-dashboard-container/platform-dashboard-container.component';
import { ProjectsTableComponent } from './pages/projects-table/projects-table.component';
import { CreateProjectDialogComponent } from './pages/projects-table/create-project-dialog/create-project-dialog.component';
import { UpdateProjectDialogComponent } from './pages/projects-table/update-project-dialog/update-project-dialog.component';
import { PlatformAppearanceComponent } from './pages/platform-appearance/platform-appearance.component';
import { PlatformSettingsComponent } from './pages/platform-settings/platform-settings.component';
import { SigningKeysTableComponent } from './pages/platform-settings/signing-keys-table/signing-keys-table.component';
import { CreateSigningKeyDialogComponent } from './pages/platform-settings/signing-keys-table/create-signing-key-dialog/create-signing-key-dialog.component';
import { PiecesTableComponent } from './pages/pieces-table/pieces-table.component';
import { EditAddPieceOAuth2CredentialsDialogComponent } from './components/dialogs/edit-add-piece-oauth-2-credentials-dialog/edit-add-piece-oauth-2-credentials-dialog.component';

@NgModule({
  imports: [
    UiCommonModule,
    CommonModule,
    RouterModule.forChild(uiEePlatformRoutes),
  ],
  declarations: [
    PlatformDashboardContainerComponent,
    ProjectsTableComponent,
    CreateProjectDialogComponent,
    UpdateProjectDialogComponent,
    PlatformAppearanceComponent,
    PlatformSettingsComponent,
    SigningKeysTableComponent,
    CreateSigningKeyDialogComponent,
    PiecesTableComponent,
    EditAddPieceOAuth2CredentialsDialogComponent,
  ],
})
export class UiEePlatformModule {}

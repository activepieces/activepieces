import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { uiEePlatformRoutes } from './lib.routes';
import { UiCommonModule } from '@activepieces/ui/common';
import { PlatformComponent } from './components/platform/platform.component';
import { ProjectsTableComponent } from './components/projects-table/projects-table.component';
import { CreateProjectDialogComponent } from './components/projects-table/create-project-dialog/create-project-dialog.component';
import { UpdateProjectDialogComponent } from './components/projects-table/update-project-dialog/update-project-dialog.component';
import { PlatformAppearanceComponent } from './components/platform-appearance/platform-appearance.component';
import { PlatformSettingsComponent } from './components/platform-settings/platform-settings.component';
import { SigningKeysTableComponent } from './components/platform-settings/signing-keys-table/signing-keys-table.component';
import { CreateSigningKeyDialogComponent } from './components/platform-settings/signing-keys-table/create-signing-key-dialog/create-signing-key-dialog.component';
import { PiecesTableComponent } from './components/pieces-table/pieces-table.component';
@NgModule({
  imports: [
    UiCommonModule,
    CommonModule,
    RouterModule.forChild(uiEePlatformRoutes),
  ],
  declarations: [
    PlatformComponent,
    ProjectsTableComponent,
    CreateProjectDialogComponent,
    UpdateProjectDialogComponent,
    PlatformAppearanceComponent,
    PlatformSettingsComponent,
    SigningKeysTableComponent,
    CreateSigningKeyDialogComponent,
    PiecesTableComponent,
  ],
})
export class UiEePlatformModule {}

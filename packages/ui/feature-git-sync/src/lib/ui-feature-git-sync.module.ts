import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfigureRepoDialogComponent } from './configure-repo-dialog/configure-repo-dialog.component';
import { PushDialogComponent } from './push-dialog/push-dialog.component';
import { PullDialogComponent } from './pull-dialog/pull-dialog.component';
import { PushFlowButtonComponent } from './push-flow-button/push-flow-button.component';
import { UiCommonModule } from '@activepieces/ui/common';

@NgModule({
  imports: [CommonModule, UiCommonModule],
  declarations: [
    ConfigureRepoDialogComponent,
    PushDialogComponent,
    PullDialogComponent,
    PushFlowButtonComponent,
  ],
  exports: [
    ConfigureRepoDialogComponent,
    PushDialogComponent,
    PullDialogComponent,
    PushFlowButtonComponent,
  ],
})
export class UiFeatureGitSyncModule {}

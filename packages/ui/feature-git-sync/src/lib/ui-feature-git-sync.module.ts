import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfigureRepoDialogComponent } from './components/dialogs/configure-repo-dialog/configure-repo-dialog.component';
import { PushToGitDialogComponent } from './components/dialogs/push-to-git-dialog/push-to-git-dialog.component';
import { PullFromGitDialogComponent } from './components/dialogs/pull-from-git-dialog/pull-from-git-dialog.component';
import { PushFlowToGitButtonComponent } from './components/push-flow-to-git-button/push-flow-to-git-button.component';
import { UiCommonModule } from '@activepieces/ui/common';

@NgModule({
  imports: [CommonModule, UiCommonModule],
  declarations: [
    ConfigureRepoDialogComponent,
    PushToGitDialogComponent,
    PullFromGitDialogComponent,
    PushFlowToGitButtonComponent,
  ],
  exports: [
    ConfigureRepoDialogComponent,
    PushToGitDialogComponent,
    PullFromGitDialogComponent,
    PushFlowToGitButtonComponent,
  ],
})
export class UiFeatureGitSyncModule {}

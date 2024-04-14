import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCommonModule } from '@activepieces/ui/common';
import { UiFeatureBuilderStoreModule } from '@activepieces/ui/feature-builder-store';
import { SupportComponent } from './components/feedback/support.component';
import { FlowBuilderHeaderComponent } from './flow-builder-header.component';
import { ToggleInstanceStateComponent } from './components/toggle-instance-state/toggle-instance-state.component';
import { PublishButtonComponent } from './components/publish-or-edit-flow-button/publish-or-edit-flow-button.component';
import { UiFeatureBuilderFormControlsModule } from '@activepieces/ui/feature-builder-form-controls';
import { EeComponentsModule } from 'ee-components';
import { EeBillingUiModule } from 'ee-billing-ui';
import { VersionHistroryButtonComponent } from './components/version-history-button/version-history-button.component';
import { RunsButtonComponent } from './components/runs-button/runs-button.component';
import { PushFlowToGitButtonComponent } from '@activepieces/ui-feature-git-sync';

const exportedDeclarations = [
  FlowBuilderHeaderComponent,
  SupportComponent,
  ToggleInstanceStateComponent,
  PublishButtonComponent,
  VersionHistroryButtonComponent,
];
@NgModule({
  imports: [
    EeComponentsModule,
    CommonModule,
    UiCommonModule,
    UiFeatureBuilderStoreModule,
    UiFeatureBuilderFormControlsModule,
    EeBillingUiModule,
    PushFlowToGitButtonComponent,
  ],
  declarations: [...exportedDeclarations, RunsButtonComponent],
  exports: [...exportedDeclarations],
})
export class UiFeatureBuilderHeaderModule {}

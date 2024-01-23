import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCommonModule } from '@activepieces/ui/common';
import { UiFeatureBuilderStoreModule } from '@activepieces/ui/feature-builder-store';
import { SupportComponent } from './feedback/support.component';
import { FlowBuilderHeaderComponent } from './flow-builder-header.component';
import { ToggleInstanceStateComponent } from './toggle-instance-state/toggle-instance-state.component';
import { PublishButtonComponent } from './publish-button/publish-button.component';
import { ImportFlowDialogueComponent } from './import-flow-dialogue/import-flow-dialogue.component';
import { UiFeatureBuilderFormControlsModule } from '@activepieces/ui/feature-builder-form-controls';
import { EeComponentsModule } from '@activepieces/ee-components';
import { EeBillingUiModule } from '@activepieces/ee-billing-ui';
import { VersionHistroryButtonComponent } from './version-history-button/version-history-button.component';

const exportedDeclarations = [
  FlowBuilderHeaderComponent,
  SupportComponent,
  ToggleInstanceStateComponent,
  PublishButtonComponent,
  ImportFlowDialogueComponent,
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
  ],
  declarations: [...exportedDeclarations],
  exports: [...exportedDeclarations],
})
export class UiFeatureBuilderHeaderModule {}

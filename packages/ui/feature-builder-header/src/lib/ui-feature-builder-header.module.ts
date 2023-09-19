import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCommonModule } from '@activepieces/ui/common';
import { UiFeatureBuilderStoreModule } from '@activepieces/ui/feature-builder-store';
import { FeedbackComponent } from './feedback/feedback.component';
import { FlowBuilderHeaderComponent } from './flow-builder-header.component';
import { ToggleInstanceStateComponent } from './toggle-instance-state/toggle-instance-state.component';
import { PublishButtonComponent } from './publish-button/publish-button.component';
import { DraftStatusComponent } from './draft-status/draft-status.component';
import { ImportFlowDialogueComponent } from './import-flow-dialogue/import-flow-dialogue.component';

const exportedDeclarations = [
  FlowBuilderHeaderComponent,
  FeedbackComponent,
  ToggleInstanceStateComponent,
  PublishButtonComponent,
];
@NgModule({
  imports: [
    CommonModule,
    UiCommonModule,
    UiFeatureBuilderStoreModule,
    UiCommonModule,
  ],
  declarations: [
    ...exportedDeclarations,
    DraftStatusComponent,
    ImportFlowDialogueComponent,
  ],
  exports: [...exportedDeclarations],
})
export class UiFeatureBuilderHeaderModule {}

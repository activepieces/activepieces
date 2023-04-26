import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCommonModule } from '@activepieces/ui/common';
import { UiFeatureBuilderStoreModule } from '@activepieces/ui/feature-builder-store';
import { FeedbackComponent } from './feedback/feedback.component';
import { MagicWandDialogComponent } from './magic-wand-dialog/magic-flow-dialog.component';
import { FlowBuilderHeaderComponent } from './flow-builder-header.component';
import { ToggleInstanceStateComponent } from './toggle-instance-state/toggle-instance-state.component';
import { PublishButtonComponent } from './publish-button/publish-button.component';
import { TestFlowModalComponent } from './test-flow-modal/test-flow-modal.component';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';

const exportedDeclarations = [
  FlowBuilderHeaderComponent,
  FeedbackComponent,
  MagicWandDialogComponent,
  ToggleInstanceStateComponent,
  PublishButtonComponent,
  TestFlowModalComponent,
];
@NgModule({
  imports: [
    CommonModule,
    UiCommonModule,
    UiFeatureBuilderStoreModule,
    CodemirrorModule,
    UiCommonModule,
  ],
  declarations: [...exportedDeclarations],
  exports: [...exportedDeclarations],
})
export class UiFeatureBuilderHeaderModule {}

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCommonModule } from '@activepieces/ui/common';
import { UiFeatureBuilderStoreModule } from '@activepieces/ui/feature-builder-store';
import { FlowBuilderHeaderComponent } from './flow-builder-header/flow-builder-header.component';
import { FeedbackComponent } from './flow-builder-header/feedback/feedback.component';
import { MagicWandDialogComponent } from './flow-builder-header/magic-wand-dialog/magic-flow-dialog.component';
import { ToggleInstanceStateComponent } from './flow-builder-header/toggle-instance-state/toggle-instance-state.component';
import { PublishButtonComponent } from './flow-builder-header/publish-button/publish-button.component';

const exportedDeclarations = [
  FlowBuilderHeaderComponent,
  FeedbackComponent,
  MagicWandDialogComponent,
  ToggleInstanceStateComponent,
  PublishButtonComponent,
];
@NgModule({
  imports: [CommonModule, UiCommonModule, UiFeatureBuilderStoreModule],
  declarations: [...exportedDeclarations],
  exports: [...exportedDeclarations],
})
export class UiFeatureBuilderHeaderModule {}

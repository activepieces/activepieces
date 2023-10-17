import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCommonModule } from '@activepieces/ui/common';
import { ShareFlowTemplateDialogComponent } from './share-flow-template-dialog/share-flow-template-dialog.component';
import { UiFeatureBuilderFormControlsModule } from '@activepieces/ui/feature-builder-form-controls';

@NgModule({
  imports: [CommonModule, UiCommonModule, UiFeatureBuilderFormControlsModule],
  declarations: [ShareFlowTemplateDialogComponent],
  exports: [ShareFlowTemplateDialogComponent]
})
export class EeComponentsModule {}

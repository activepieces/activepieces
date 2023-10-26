import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCommonModule } from '@activepieces/ui/common';
import { ShareFlowTemplateDialogComponent } from './share-flow-template-dialog/share-flow-template-dialog.component';
import { UiFeatureBuilderFormControlsModule } from '@activepieces/ui/feature-builder-form-controls';
import { IframeListenerComponent } from './iframe-listener/iframe-listener.component';

@NgModule({
  imports: [CommonModule, UiCommonModule, UiFeatureBuilderFormControlsModule],
  declarations: [ShareFlowTemplateDialogComponent,IframeListenerComponent],
  exports: [ShareFlowTemplateDialogComponent,IframeListenerComponent]
})
export class EeComponentsModule {}

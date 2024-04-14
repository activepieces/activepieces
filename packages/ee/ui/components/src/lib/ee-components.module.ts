import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCommonModule } from '@activepieces/ui/common';
import { ShareFlowTemplateDialogComponent } from './share-flow-template-dialog/share-flow-template-dialog.component';
import { UiFeatureBuilderFormControlsModule } from '@activepieces/ui/feature-builder-form-controls';
import { IframeListenerComponent } from './iframe-listener/iframe-listener.component';
import { EmbedRedirectComponent } from './embed-redirect/embed-redirect.component';
import { ThirdPartyAuthComponent } from './third-party-auth/third-party-auth.component';

@NgModule({
  imports: [CommonModule, UiCommonModule, UiFeatureBuilderFormControlsModule],
  declarations: [
    ShareFlowTemplateDialogComponent,
    IframeListenerComponent,
    EmbedRedirectComponent,
    ThirdPartyAuthComponent,
  ],
  exports: [
    ShareFlowTemplateDialogComponent,
    IframeListenerComponent,
    EmbedRedirectComponent,
    ThirdPartyAuthComponent,
  ],
})
export class EeComponentsModule {}

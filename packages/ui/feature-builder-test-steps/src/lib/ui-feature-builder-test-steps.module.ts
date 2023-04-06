import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCommonModule } from '@activepieces/ui/common';
import { TestPollingTriggerComponent } from './test-polling-trigger/test-polling-trigger.component';
import { TestWebhookTriggerComponent } from './test-webhook-trigger/test-webhook-trigger.component';
const exportedDeclarations =[
  TestPollingTriggerComponent,
  TestWebhookTriggerComponent
];
@NgModule({
  imports: [CommonModule,UiCommonModule],
  declarations:exportedDeclarations,
  exports:exportedDeclarations
})
export class UiFeatureBuilderTestStepsModule {}

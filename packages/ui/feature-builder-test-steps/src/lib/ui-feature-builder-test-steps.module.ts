import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCommonModule } from '@activepieces/ui/common';
import { TestPollingTriggerComponent } from './test-polling-trigger/test-polling-trigger.component';
import { TestWebhookTriggerComponent } from './test-webhook-trigger/test-webhook-trigger.component';
import { TestPieceStepComponent } from './test-piece-step/test-piece-step.component';
import { TestCodeStepComponent } from './test-code-step/test-code-step.component';
import { TestPieceWebhookTriggerComponent } from './test-piece-webhook-trigger/test-piece-webhook-trigger.component';
import { TimeagoModule } from 'ngx-timeago';

const exportedDeclarations = [
  TestPollingTriggerComponent,
  TestWebhookTriggerComponent,
  TestPieceStepComponent,
  TestCodeStepComponent,
  TestPieceWebhookTriggerComponent,
];
@NgModule({
  imports: [CommonModule, UiCommonModule, TimeagoModule.forChild()],
  declarations: exportedDeclarations,
  exports: exportedDeclarations,
})
export class UiFeatureBuilderTestStepsModule {}

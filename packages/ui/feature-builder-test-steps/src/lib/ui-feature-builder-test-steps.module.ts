import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCommonModule } from '@activepieces/ui/common';
import { TestPollingTriggerComponent } from './test-polling-trigger/test-polling-trigger.component';
import { TestPieceWebhookTriggerComponent } from './test-piece-webhook-trigger/test-piece-webhook-trigger.component';
import { TimeagoModule } from 'ngx-timeago';
import { TestActionComponent } from './test-action/test-action.component';

const exportedDeclarations = [
  TestPollingTriggerComponent,
  TestActionComponent,
  TestPieceWebhookTriggerComponent,
];
@NgModule({
  imports: [CommonModule, UiCommonModule, TimeagoModule.forChild()],
  declarations: exportedDeclarations,
  exports: exportedDeclarations,
})
export class UiFeatureBuilderTestStepsModule {}

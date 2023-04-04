import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TestWebhookTriggerComponent } from './test-webhook-trigger/test-webhook-trigger.component';
import { CommonLayoutModule } from '../common/common-layout.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TestPollingTriggerComponent } from './test-polling-trigger/test-polling-trigger.component';

@NgModule({
  declarations: [TestWebhookTriggerComponent, TestPollingTriggerComponent],
  exports: [TestWebhookTriggerComponent, TestPollingTriggerComponent],
  imports: [CommonModule, CommonLayoutModule, FormsModule, ReactiveFormsModule],
})
export class TestingStepsAndTriggersModule {}

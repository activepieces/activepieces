import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TestWebhookTriggerComponent } from './test-webhook-trigger/test-webhook-trigger.component';
import { CommonLayoutModule } from '../common/common-layout.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [TestWebhookTriggerComponent],
  exports: [TestWebhookTriggerComponent],
  imports: [CommonModule, CommonLayoutModule, FormsModule, ReactiveFormsModule],
})
export class TestingStepsAndTriggersModule {}

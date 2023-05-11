import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UiCommonModule } from '@activepieces/ui/common';
import { PromptInputComponent } from './prompt-input/prompt-input.component';
import { PromptsTableComponent } from './prompts-table/prompts-table.component';
import { PromptIconsComponent } from './prompts-table/prompt-icons/prompt-icons.component';
import { GuessFlowComponent } from './guess-flow.component';
import { LottieModule } from 'ngx-lottie';
import { AiGeneratedFlowFeedbackComponent } from './ai-generated-flow-feedback/ai-generated-flow-feedback.component';
@NgModule({
  declarations: [
    GuessFlowComponent,
    PromptInputComponent,
    PromptsTableComponent,
    PromptIconsComponent,
    AiGeneratedFlowFeedbackComponent,
  ],
  imports: [CommonModule, UiCommonModule, LottieModule],
})
export class GuessFlowModule {}
export class GuessFlowComponentRef extends GuessFlowComponent {}

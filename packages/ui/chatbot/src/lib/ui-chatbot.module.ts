import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatComponent } from './chat/chat.component';
import { UiCommonModule } from '@activepieces/ui/common';
import { RouterModule } from '@angular/router';
import { ChatbotLayoutRoutes } from './ui-chatbot-routes';
import { ChatbotTypeComponent } from './chatbot-type/chatbot-type.component';
import { ChatbotSettingsComponent } from './chatbot-settings/chatbot-settings.component';

@NgModule({
  imports: [
    CommonModule,
    UiCommonModule,
    RouterModule.forChild(ChatbotLayoutRoutes),
  ],
  declarations: [ChatComponent, ChatbotTypeComponent, ChatbotSettingsComponent],
  exports: [ChatbotTypeComponent],
})
export class UiChatbotModule {}

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatComponent } from './chat/chat.component';
import { UiCommonModule } from '@activepieces/ui/common';
import { RouterModule } from '@angular/router';
import { ChatbotLayoutRoutes } from './ui-chatbot-routes';
import { ChatbotsTableComponent } from './chatbots-table/chatbots-table.component';

@NgModule({
  imports: [
    CommonModule,
    UiCommonModule,
    RouterModule.forChild(ChatbotLayoutRoutes),
  ],
  declarations: [ChatComponent, ChatbotsTableComponent],
})
export class UiChatbotModule {}

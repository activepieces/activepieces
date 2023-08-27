import { Routes } from '@angular/router';
import { ChatComponent } from './chat/chat.component';
import { chatbotSettingsResolver } from './chatbot-settings.resolver';

export const ChatbotLayoutRoutes: Routes = [
  {
    path: 'chatbots/:id',
    canActivate: [],
    title: `ChatBot`,
    pathMatch: 'full',
    component: ChatComponent,
    resolve: {
      chatbot: chatbotSettingsResolver,
    },
  },
];

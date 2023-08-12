import { Routes } from '@angular/router';
import { ChatComponent } from './chat/chat.component';
import { ChatbotSettingsComponent } from './chatbot-settings/chatbot-settings.component';

export const ChatbotLayoutRoutes: Routes = [
  {
    path: 'chatbots/:id',
    canActivate: [],
    title: `ChatBot`,
    pathMatch: 'full',
    component: ChatComponent
  },
  {
    path: 'chatbots/:id/settings',
    canActivate: [],
    title: `ChatBot Settings`,
    pathMatch: 'full',
    component: ChatbotSettingsComponent
  }
];

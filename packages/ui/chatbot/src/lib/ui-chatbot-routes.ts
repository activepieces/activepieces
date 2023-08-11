import { Routes } from '@angular/router';
import { ChatComponent } from './chat/chat.component';
import { ChatbotsTableComponent } from './chatbots-table/chatbots-table.component';

export const ChatbotLayoutRoutes: Routes = [
  {
    path: 'chatbots/:id',
    canActivate: [],
    title: `ChatBot`,
    pathMatch: 'full',
    component: ChatComponent
  },
  {
    path: 'chatbots',
    canActivate: [],
    title: `ChatBots`,
    pathMatch: 'full',
    component: ChatbotsTableComponent
  }
];

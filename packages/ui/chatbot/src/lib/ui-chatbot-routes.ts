import { Routes } from '@angular/router';
import { ChatComponent } from './chat/chat.component';

export const ChatbotLayoutRoutes: Routes = [
  {
    path: 'chatbots/:id',
    canActivate: [],
    title: `ChatBot`,
    pathMatch: 'full',
    component: ChatComponent
  },
];

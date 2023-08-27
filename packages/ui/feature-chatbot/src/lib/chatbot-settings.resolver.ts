import { ResolveFn } from '@angular/router';
import { ChatBotService } from './chatbot.service';
import { inject } from '@angular/core';
import { Chatbot } from '@activepieces/shared';

export const chatbotSettingsResolver: ResolveFn<Chatbot> = (route) => {
  const id = route.params['id'];
  return inject(ChatBotService).get(id);
};

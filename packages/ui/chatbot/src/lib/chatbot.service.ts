import { Chatbot, ChatbotResponse, SeekPage, CreateChatBotRequest } from '@activepieces/shared';
import { CURSOR_QUERY_PARAM, LIMIT_QUERY_PARAM, environment } from '@activepieces/ui/common';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ChatBotService {
  constructor(private http: HttpClient) {}

  create(request: CreateChatBotRequest) {
    return this.http.post<Chatbot>(
      environment.apiUrl + '/chatbots',
      request
    );
  }
  
  ask(req: { chatbotId: string; input: string }) {
    return this.http.post<ChatbotResponse>(
      environment.apiUrl + '/chatbots/' + req.chatbotId + '/ask',
      {
        input: req.input
      }
    );
  }

  list({ limit, cursor }: { limit: number; cursor?: string }) {
    const queryParams: { [key: string]: string | number } = {};
    if (cursor) {
      queryParams[CURSOR_QUERY_PARAM] = cursor;
    }
    if (limit) {
      queryParams[LIMIT_QUERY_PARAM] = limit;
    }
    return this.http.get<SeekPage<Chatbot>>(
      environment.apiUrl + '/chatbots',
      {
        params: queryParams,
      }
    );
  }
}

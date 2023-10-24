import {
  Chatbot,
  ChatbotResponse,
  CreateChatBotRequest,
  UpdateChatbotRequest,
  CreateDataSourceRequest,
  ChatbotMetadata,
} from '@activepieces/shared';
import { SeekPage } from '@activepieces/shared';
import {
  CURSOR_QUERY_PARAM,
  LIMIT_QUERY_PARAM,
  environment,
} from '@activepieces/ui/common';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import {AskChatBotRequest} from '@activepieces/shared'
@Injectable({
  providedIn: 'root',
})
export class ChatBotService {
  constructor(private http: HttpClient) {}

  create(request: CreateChatBotRequest) {
    return this.http.post<Chatbot>(environment.apiUrl + '/chatbots', request);
  }

  update(chatbotId: string, request: UpdateChatbotRequest) {
    return this.http.post<Chatbot>(
      environment.apiUrl + '/chatbots/' + chatbotId,
      request
    );
  }

  get(id: string) {
    return this.http.get<Chatbot>(environment.apiUrl + '/chatbots/' + id);
  }

  metadata(id: string) {
    return this.http.get<ChatbotMetadata>(
      environment.apiUrl + '/chatbots/' + id + '/metadata'
    );
  }

  ask(req: AskChatBotRequest) {
    return this.http.post<ChatbotResponse>(
      environment.apiUrl + '/chatbots/' + req.chatbotId + '/ask',
      {
        input: req.input,
        history:req.history
      }
    ).pipe(map(res=>{
      const withHtmlNewLines= res.output;
      withHtmlNewLines.replaceAll('\n',' <br>');
      return {...res, output: withHtmlNewLines};
    }));
  }

  list({ limit, cursor }: { limit: number; cursor?: string }) {
    const queryParams: { [key: string]: string | number } = {};
    if (cursor) {
      queryParams[CURSOR_QUERY_PARAM] = cursor;
    }
    if (limit) {
      queryParams[LIMIT_QUERY_PARAM] = limit;
    }
    return this.http.get<SeekPage<Chatbot>>(environment.apiUrl + '/chatbots', {
      params: queryParams,
    });
  }

  delete(id: string) {
    return this.http.delete<void>(environment.apiUrl + '/chatbots/' + id);
  }
  addDataSource(chatbotId: string, req: CreateDataSourceRequest) {
    return this.http.post<Chatbot>(
      environment.apiUrl + `/chatbots/${chatbotId}/datasources`,
      req
    );
  }
  deleteDataSource({
    chatbotId,
    dataSourceId,
  }: {
    chatbotId: string;
    dataSourceId: string;
  }) {
    return this.http.delete<Chatbot>(
      environment.apiUrl + `/chatbots/${chatbotId}/datasources/${dataSourceId}`
    );
  }
}

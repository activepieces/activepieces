import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PromptTemplate } from '../prompt-templates';

@Injectable({
  providedIn: 'root',
})
export class PromptsService {
  constructor(private http: HttpClient) {}

  getPrompts() {
    return this.http.get<PromptTemplate[]>(
      'https://cdn.activepieces.com/AI_Templates/prompts.json'
    );
  }
  savePromptAndResult(request: {
    prompt: string;
    result: string;
    email: string;
  }) {
    return this.http.post(
      'https://cloud.activepieces.com/api/v1/webhooks/TYbw81ZpfYRfMYDLPrtvP',
      request
    );
  }
  savePrompt(request: { prompt: string; email: string }) {
    return this.http.post(
      'https://cloud.activepieces.com/api/v1/webhooks/liggKrTlbyYNQ4ciJsy6b',
      request
    );
  }
  saveFeedback(request: {
    prompt: string;
    email: string;
    feedback: string;
    flow: string;
    like: boolean;
  }) {
    return this.http.post(
      'https://cloud.activepieces.com/api/v1/webhooks/23FP6jEYyO78tZkSba8lv',
      request
    );
  }
}

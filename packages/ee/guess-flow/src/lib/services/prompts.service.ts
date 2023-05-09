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
      'https://cdn.activepieces.com/templates/ai-content-gen.jsonhttps://cdn.activepieces.com/templates/prompts.json'
    );
  }
  savePromptAndResult(request: {
    prompt: string;
    result: string;
    userId: string;
  }) {
    return this.http.post(
      'https://cloud.activepieces.com/api/v1/webhooks/TYbw81ZpfYRfMYDLPrtvP',
      request
    );
  }
  savePrompt(request: { prompt: string; userId: string }) {
    return this.http.post(
      'https://cloud.activepieces.com/api/v1/webhooks/liggKrTlbyYNQ4ciJsy6b',
      request
    );
  }
}

import { environment } from '@activepieces/ui/common';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class InputWriterService {
  constructor(private http: HttpClient) {}

  // TODO Rename CodeWriterService to CopilotService ??
  generateInputs(prompt: string): Observable<{ result: string }> {
    return this.http.post<{ result: string }>(
      environment.apiUrl + '/copilot/inputs',
      {
        prompt,
      }
    );
  }
}

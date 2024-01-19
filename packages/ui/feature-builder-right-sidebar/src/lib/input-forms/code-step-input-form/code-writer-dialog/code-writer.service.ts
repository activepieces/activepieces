import { environment } from '@activepieces/ui/common';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CodeWriterService {
  constructor(private http: HttpClient) {}

  prompt(prompt: string): Observable<{ result: string }> {
    return this.http.post<{ result: string }>(
      environment.apiUrl + `/copilot/code`,
      {
        prompt: prompt,
      }
    );
  }
}

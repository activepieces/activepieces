import { FlowRetryStrategy } from '@activepieces/shared';
import { environment } from '@activepieces/ui/common';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
@Injectable({
  providedIn: 'root',
})
export class RunsService {
  constructor(private http: HttpClient) {}

  retry(runId: string, strategy: FlowRetryStrategy) {
    return this.http.post<void>(
      environment.apiUrl + `/flow-runs/${runId}/retry`,
      {},
      {
        params: {
          strategy,
        },
      }
    );
  }
}

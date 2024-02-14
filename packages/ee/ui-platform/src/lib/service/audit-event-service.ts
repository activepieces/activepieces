import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@activepieces/ui/common';
import { SeekPage } from '@activepieces/shared';
import {
  ApplicationEvent,
  ListAuditEventsRequest,
} from '@activepieces/ee-shared';

@Injectable({
  providedIn: 'root',
})
export class AuditEventService {
  constructor(private http: HttpClient) {}
  list(request: ListAuditEventsRequest) {
    return this.http.get<SeekPage<ApplicationEvent>>(
      environment.apiUrl + '/audit-events',
      { params: request }
    );
  }
}

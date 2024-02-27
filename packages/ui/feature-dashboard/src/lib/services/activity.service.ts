import { Activity, ListActivityParams } from '@activepieces/ee-shared';
import { SeekPage } from '@activepieces/shared';
import { environment } from '@activepieces/ui/common';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Params } from '@angular/router';
@Injectable({
  providedIn: 'root',
})
export class ActivityService {
  constructor(private http: HttpClient) {}

  list(req: ListActivityParams) {
    const params: Params = {
      projectId: req.projectId,
      cursor: req.cursor,
      limit: req.limit,
    };
    return this.http.get<SeekPage<Activity>>(
      environment.apiUrl + `/activities`,
      {
        params,
      }
    );
  }
}

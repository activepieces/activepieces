import { Injectable } from '@angular/core';

import { map, Observable } from 'rxjs';
import { AuthenticationService, FlowService } from '@activepieces/ui/common';
import { DEFAULT_PAGE_SIZE } from '@activepieces/ui/common';
export const ARE_THERE_FLOWS_FLAG = 'areThererFlows';
@Injectable({
  providedIn: 'root',
})
export class AreThereFlowsResolver {
  constructor(
    private flowService: FlowService,
    private authenticationService: AuthenticationService
  ) {}

  resolve(): Observable<boolean> {
    return this.flowService
      .list({
        limit: DEFAULT_PAGE_SIZE,
        cursor: undefined,
        projectId: this.authenticationService.getProjectId(),
      })
      .pipe(
        map((res) => {
          return res.data.length > 0;
        })
      );
  }
}

import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { map, Observable } from 'rxjs';
import { FlowService } from '@activepieces/ui/common';
import { DEFAULT_PAGE_SIZE } from '@activepieces/ui/common';
export const ARE_THERE_FLOWS_FLAG = 'areThererFlows';
@Injectable({
  providedIn: 'root',
})
export class AreThereFlowsResovler implements Resolve<Observable<boolean>> {
  constructor(private flowService: FlowService) {}

  resolve(): Observable<boolean> {
    return this.flowService
      .list({ limit: DEFAULT_PAGE_SIZE, cursor: undefined })
      .pipe(
        map((res) => {
          return res.data.length > 0;
        })
      );
  }
}

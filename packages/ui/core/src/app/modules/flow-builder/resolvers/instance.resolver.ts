import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { Observable, catchError, of } from 'rxjs';
import { FlowInstance } from '@activepieces/shared';
import { FlowInstanceService } from '@activepieces/ui/common';

@Injectable({
  providedIn: 'root',
})
export class InstanceResolver
  implements Resolve<Observable<FlowInstance | undefined>>
{
  constructor(private instanceService: FlowInstanceService) {}

  resolve(
    snapshot: ActivatedRouteSnapshot
  ): Observable<FlowInstance | undefined> {
    const flowId = snapshot.paramMap.get('id') as string;
    return this.instanceService.get(flowId).pipe(
      catchError((err) => {
        return of(undefined);
      })
    );
  }
}

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
import { FlowInstance, FlowVersion } from '@activepieces/shared';
import { FlowInstanceService, FlowService } from '@activepieces/ui/common';

export type InstanceResolverData =
  | {
      instance: FlowInstance;
      publishedFlowVersion: FlowVersion;
    }
  | undefined;

@Injectable({
  providedIn: 'root',
})
export class InstanceResolver {
  constructor(
    private instanceService: FlowInstanceService,
    private flowService: FlowService
  ) {}

  resolve(snapshot: ActivatedRouteSnapshot): Observable<InstanceResolverData> {
    const flowId = snapshot.paramMap.get('id') as string;
    return this.instanceService.get(flowId).pipe(
      catchError((err) => {
        return of(undefined);
      }),
      switchMap((instance) => {
        if (instance) {
          return this.flowService
            .get(instance.flowId, instance.flowVersionId)
            .pipe(
              map((flow) => {
                return {
                  publishedFlowVersion: flow.version,
                  instance: instance,
                };
              })
            );
        }
        return of(undefined);
      })
    );
  }
}

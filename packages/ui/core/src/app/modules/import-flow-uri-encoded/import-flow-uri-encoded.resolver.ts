import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { EMPTY, Observable, catchError, switchMap, tap } from 'rxjs';
import { FlowService } from '@activepieces/ui/common';
import { FlowOperationType, FlowTemplate } from '@activepieces/shared';

@Injectable({
  providedIn: 'root',
})
export class ImportFlowUriEncodedResolver {
  resolve(snapshot: ActivatedRouteSnapshot): Observable<unknown> {
    const combinationB64 = snapshot.queryParamMap.get('flow');
    if (!combinationB64) {
      this.router.navigate(['/']);
      return EMPTY;
    }
    try {
      const decodedFlow = decodeURIComponent(combinationB64);
      const combinationJson: FlowTemplate = JSON.parse(decodedFlow);
      return this.flowService
        .create({
          displayName: combinationJson.name,
        })
        .pipe(
          switchMap((res) => {
            return this.flowService.update(res.id, {
              type: FlowOperationType.IMPORT_FLOW,
              request: combinationJson.template,
            });
          }),
          tap((res) => {
            this.router.navigate(['flows', res.id]);
          }),
          catchError((err) => {
            console.error(err);
            this.router.navigate(['/']);
            return EMPTY;
          })
        );
    } catch (ex) {
      console.error(ex);
      this.router.navigate(['/']);
    }
    return EMPTY;
  }
  constructor(private flowService: FlowService, private router: Router) {}
}

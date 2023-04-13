import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { Observable, of } from 'rxjs';
import { Instance } from '@activepieces/shared';

@Injectable({
  providedIn: 'root',
})
export class InstacneResolver
  implements Resolve<Observable<Instance | undefined>>
{
  resolve(snapshot: ActivatedRouteSnapshot): Observable<Instance | undefined> {
    // TODO: Implement this
    return of(undefined);
  }
}

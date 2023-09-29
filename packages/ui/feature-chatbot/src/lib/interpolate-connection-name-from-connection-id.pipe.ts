import { Pipe, PipeTransform } from '@angular/core';
import { AppConnectionWithoutSensitiveData } from '@activepieces/shared';
import { Observable, map } from 'rxjs';

@Pipe({
  name: 'interpolateConnectionNameFromConnectionId',
})
export class GetInterpolatedConnectionNameFromConnectionIdPipe
  implements PipeTransform
{
  transform(
    connectionId: string,
    connections$: Observable<AppConnectionWithoutSensitiveData[]>
  ): Observable<string> {
    return connections$.pipe(
      map((connections) => {
        const res = connections.find((c) => c.id === connectionId);
        if (!res) {
          console.error(`connection with id: ${connectionId} not found`);
        }
        return `{{connections['${res?.name}']}}`;
      })
    );
  }
}

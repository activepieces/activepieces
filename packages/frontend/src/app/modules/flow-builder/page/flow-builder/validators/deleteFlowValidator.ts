import { map, Observable } from 'rxjs';
import { Flow } from '@activepieces/shared';

export class DeleteFlowValidator {
  static createValidator(allFlows$: Observable<Flow[]>) {
    return () => {
      return allFlows$.pipe(
        map((flows) => {
          const thereIsOnlyOneFlow = flows.length === 1;
          if (thereIsOnlyOneFlow) {
            return { lastFlow: true };
          }
          return null;
        })
      );
    };
  }
}

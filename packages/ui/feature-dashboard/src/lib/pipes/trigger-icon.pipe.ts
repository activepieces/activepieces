import { Pipe, PipeTransform } from '@angular/core';
import { PopulatedFlow, TriggerType } from '@activepieces/shared';
@Pipe({
  name: 'triggerIcon',
  standalone: true,
  pure: true,
})
export class TriggerIconPipe implements PipeTransform {
  transform(flow: PopulatedFlow): string {
    const trigger = flow.version.trigger;
    switch (trigger.type) {
      case TriggerType.PIECE: {
        const cronExpression = flow.schedule?.cronExpression;
        if (cronExpression) {
          return 'assets/img/custom/triggers/periodic-filled.svg';
        } else {
          return 'assets/img/custom/triggers/instant-filled.svg';
        }
      }
      case TriggerType.EMPTY: {
        console.error(
          "Flow can't be published with empty trigger " +
            flow.version.displayName
        );
        return 'assets/img/custom/warn.svg';
      }
    }
  }
}

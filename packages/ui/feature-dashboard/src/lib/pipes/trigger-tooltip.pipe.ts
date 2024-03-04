import { Pipe, PipeTransform } from '@angular/core';
import { PopulatedFlow, TriggerType } from '@activepieces/shared';
import cronstrue from 'cronstrue/i18n';
@Pipe({
  name: 'triggerTooltip',
  standalone: true,
  pure: true,
})
export class TriggerTooltipPipe implements PipeTransform {
  transform(flow: PopulatedFlow, locale: string): string {
    const trigger = flow.version.trigger;
    switch (trigger.type) {
      case TriggerType.PIECE: {
        const cronExpression = flow.schedule?.cronExpression;
        return cronExpression
          ? $localize`Runs ${cronstrue
              .toString(cronExpression, { locale })
              .toLocaleLowerCase()}`
          : $localize`Real time flow`;
      }
      case TriggerType.EMPTY: {
        console.error(
          "Flow can't be published with empty trigger " +
            flow.version.displayName
        );
        return $localize`Please contact support as your published flow has a problem`;
      }
    }
  }
}

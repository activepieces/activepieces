import {
  ActionBase,
  TriggerBase,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'isTriggerGuard',
  standalone: true,
  pure: true,
})
export class IsTriggerGuardPipe implements PipeTransform {
  transform(value: ActionBase | TriggerBase | undefined): value is TriggerBase {
    return (
      !!value &&
      ((value as TriggerBase).type === TriggerStrategy.APP_WEBHOOK ||
        (value as TriggerBase).type === TriggerStrategy.POLLING ||
        (value as TriggerBase).type === TriggerStrategy.WEBHOOK)
    );
  }
}

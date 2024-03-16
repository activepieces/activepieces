import { ActionBase, TriggerBase } from '@activepieces/pieces-framework';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'isTriggerGuard',
  standalone: true,
  pure: true,
})
export class IsTriggerGuardPipe implements PipeTransform {
  transform(value: ActionBase | TriggerBase): value is TriggerBase {
    return (value as TriggerBase).type !== undefined;
  }
}

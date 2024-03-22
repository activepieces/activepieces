import { ActionBase, TriggerBase } from '@activepieces/pieces-framework';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'selectedTirggerOrAction',
  standalone: true,
  pure: true,
})
export class selectedTirggerOrActionPipe implements PipeTransform {
  transform(
    value: string,
    items: ActionBase[] | TriggerBase[]
  ): string | undefined {
    return items.find((i) => i.name === value)?.displayName;
  }
}

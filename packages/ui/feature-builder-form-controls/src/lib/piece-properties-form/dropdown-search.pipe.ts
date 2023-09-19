import { Pipe, PipeTransform } from '@angular/core';
import { DropdownOption } from '@activepieces/pieces-framework';

@Pipe({
  name: 'dropdownSearch',
  pure: true,
})
export class DropdownPropertySearchPipe implements PipeTransform {
  transform(
    options: DropdownOption<unknown>[],
    search: string
  ): { item: DropdownOption<unknown>; show: boolean }[] {
    return options.map((o) => {
      return {
        item: o,
        show: o.label.toLowerCase().includes(search.toLowerCase()),
      };
    });
  }
}

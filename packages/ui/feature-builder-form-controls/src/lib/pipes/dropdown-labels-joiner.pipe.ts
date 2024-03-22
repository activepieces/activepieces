import { Pipe, PipeTransform } from '@angular/core';
import { DropdownOption } from '@activepieces/pieces-framework';

@Pipe({
  name: 'dropdownLabelsJoiner',
  pure: true,
  standalone: true,
})
/**Since we are using virutal scrolling inside dropdown, this means that options don't get rendered until the dropdown is clicked, making the dropdown unable to show the selected value/s
     This pipe is used to show the selected value/s in the dropdown*/
export class DropdownLabelsJoiner implements PipeTransform {
  transform(options: DropdownOption<unknown>[]): string {
    return options.map((option) => option.label).join(', ');
  }
}

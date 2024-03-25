import { Pipe, PipeTransform } from '@angular/core';
import { DropdownOption } from '@activepieces/pieces-framework';
import { UntypedFormControl } from '@angular/forms';
import { Observable, map, startWith } from 'rxjs';
import deepEqual from 'deep-equal';

@Pipe({
  name: 'dropdownSelectedValues',
  pure: true,
  standalone: true,
})
/**Since we are using virutal scrolling inside dropdown, this means that options don't get rendered until the dropdown is clicked, making the dropdown unable to show the selected value/s
   This pipe is used to show the selected value/s in the dropdown*/
export class DropdownSelectedValuesPipe implements PipeTransform {
  transform(
    options: DropdownOption<unknown>[],
    formControl: UntypedFormControl
  ): Observable<DropdownOption<unknown>[] | undefined> | undefined {
    return formControl.valueChanges.pipe(
      startWith(formControl.value),
      map((formControlValue) => {
        if (!Array.isArray(formControlValue)) {
          const initialValue = options.find((o) => {
            return deepEqual(o.value, formControlValue);
          });
          if (initialValue) {
            return [initialValue];
          }
        } else {
          return options.filter((o) => {
            return !!formControlValue.find((v) => deepEqual(v, o.value));
          });
        }
        return undefined;
      })
    );
  }
}

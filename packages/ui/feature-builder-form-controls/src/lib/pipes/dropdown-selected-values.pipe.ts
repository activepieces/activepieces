import { Pipe, PipeTransform } from '@angular/core';
import { DropdownOption } from '@activepieces/pieces-framework';
import { UntypedFormControl } from '@angular/forms';
import { BehaviorSubject, Observable, map, startWith } from 'rxjs';
import deepEqual from 'deep-equal';

@Pipe({
  name: 'dropdownSelectedValues',
  pure: true,
  standalone: true,
})
/**Since we are using virtual scrolling inside dropdown, this means that options don't get rendered until the dropdown is clicked, making the dropdown unable to show the selected value/s
   This pipe is used to show the selected value/s in the dropdown*/
export class DropdownSelectedValuesPipe implements PipeTransform {
  transform(
    options: DropdownOption<unknown>[],
    formControl: UntypedFormControl,
    cache$?: BehaviorSubject<DropdownOption<unknown>[]>
  ): Observable<DropdownOption<unknown>[] | undefined> | undefined {
    return formControl.valueChanges.pipe(
      startWith(formControl.value),
      map((formControlValue) => {
        let result: DropdownOption<unknown>[] = [];
        if (!Array.isArray(formControlValue)) {
          const initialValue = options.find((o) => {
            return deepEqual(o.value, formControlValue);
          });
          if (initialValue) {
            result = [initialValue];
            if (cache$) {
              cache$.next(result);
            }
          }
        } else {
          result = options.filter((o) => {
            return !!formControlValue.find((v) => deepEqual(v, o.value));
          });
          if (result.length === formControlValue.length && cache$) {
            cache$.next(result);
          }
        }

        return cache$?.value ?? result;
      })
    );
  }
}

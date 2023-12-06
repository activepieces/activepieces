import { Pipe, PipeTransform } from '@angular/core';
import { DropdownOption } from '@activepieces/pieces-framework';
import { FormGroup } from '@angular/forms';
import { Observable, map, startWith } from 'rxjs';

@Pipe({
  name: 'dropdownInitialValue',
  pure: true,
})
export class DropdownPropertyInitialValuePipe implements PipeTransform {
  transform(
    options: DropdownOption<unknown>[],
    formControlName: string,
    formGroup: FormGroup
  ): Observable<DropdownOption<unknown>[] | undefined> | undefined {
    const formControl = formGroup.get(formControlName);
    if (!formControl) {
      console.warn(`form control not found : ${formControlName}`);
      return undefined;
    }
    return formControl.valueChanges.pipe(
      startWith(formControl.value),
      map((formControlValue) => {
        if (!Array.isArray(formControlValue)) {
          const initialValue = options.find((o) => {
            return o.value === formGroup.get(formControlName)?.value;
          });
          if (initialValue) {
            return [initialValue];
          }
        } else {
          return options.filter((o) => {
            return formControlValue.includes(o.value);
          });
        }
        return undefined;
      })
    );
  }
}

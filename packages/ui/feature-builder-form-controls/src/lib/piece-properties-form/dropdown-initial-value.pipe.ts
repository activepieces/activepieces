import { Pipe, PipeTransform } from '@angular/core';
import { DropdownOption } from '@activepieces/pieces-framework';
import { FormGroup } from '@angular/forms';

@Pipe({
  name: 'dropdownInitialValue',
  pure: true,
})
export class DropdownPropertyInitialValuePipe implements PipeTransform {
  transform(
    options: DropdownOption<unknown>[],
    formControlName: string,
    formGroup: FormGroup
  ): DropdownOption<unknown>[] | undefined {
    const formControlValue = formGroup.get(formControlName)?.value;
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
  }
}

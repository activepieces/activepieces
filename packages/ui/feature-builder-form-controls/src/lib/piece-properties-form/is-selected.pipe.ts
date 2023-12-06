import { Pipe, PipeTransform } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Pipe({
  name: 'isDropdownItemSelected',
  pure: true,
})
export class isDropdownItemSelectedPipe implements PipeTransform {
  transform(item: unknown, fromControl: string, formGroup: FormGroup): boolean {
    const formControl = formGroup.get(fromControl);
    if (!formControl) {
      console.warn(`form control not found : ${fromControl}`);
      return false;
    }
    const formControlValue = formControl.value;
    if (!Array.isArray(formControlValue)) {
      return formControlValue === item;
    } else {
      return formControlValue.includes(item);
    }
  }
}

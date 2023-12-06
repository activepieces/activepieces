import { Pipe, PipeTransform } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Observable, map, startWith } from 'rxjs';

@Pipe({
  name: 'isDropdownItemSelected',
  pure: true,
})
export class isDropdownItemSelectedPipe implements PipeTransform {
  transform(
    item: unknown,
    fromControl: string,
    formGroup: FormGroup
  ): Observable<boolean> | undefined {
    const formControl = formGroup.get(fromControl);
    if (!formControl) {
      console.warn(`form control not found : ${fromControl}`);
      return undefined;
    }
    return formControl.valueChanges.pipe(
      startWith(formControl.value),
      map((formControlValue) => {
        if (!Array.isArray(formControlValue)) {
          return formControlValue === item;
        } else {
          return formControlValue.includes(item);
        }
      })
    );
  }
}

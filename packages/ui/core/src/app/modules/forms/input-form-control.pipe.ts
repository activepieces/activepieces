import { Pipe, PipeTransform } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';

export const getInputKey = (str: string) => {
  return str
    .replace(/\s(.)/g, function ($1) {
      return $1.toUpperCase();
    })
    .replace(/\s/g, '')
    .replace(/^(.)/, function ($1) {
      return $1.toLowerCase();
    });
};
@Pipe({
  name: 'inputFormControl',
  pure: true,
})
export class InputFormControlPipe implements PipeTransform {
  transform(
    inputDisplayName: string,
    form: UntypedFormGroup
  ): UntypedFormControl {
    return form.controls[getInputKey(inputDisplayName)] as UntypedFormControl;
  }
}

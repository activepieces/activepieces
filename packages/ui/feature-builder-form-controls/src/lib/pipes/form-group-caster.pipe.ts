import { Pipe, PipeTransform } from '@angular/core';
import { AbstractControl, UntypedFormGroup } from '@angular/forms';

@Pipe({
  name: 'formGroupCaster',
  pure: true,
  standalone: true,
})
/**Since we are using virtual scrolling inside dropdown, this means that options don't get rendered until the dropdown is clicked, making the dropdown unable to show the selected value/s
     This pipe is used to show the selected value/s in the dropdown*/
export class FormGroupCasterPipe implements PipeTransform {
  transform(formControl: AbstractControl): UntypedFormGroup {
    return formControl as UntypedFormGroup;
  }
}

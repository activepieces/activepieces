import { Pipe, PipeTransform } from '@angular/core';
import { AbstractControl, UntypedFormControl } from '@angular/forms';

@Pipe({
  name: 'abstractFormControlCaster',
  pure: true,
  standalone: true,
})
/**Since we are using virtual scrolling inside dropdown, this means that options don't get rendered until the dropdown is clicked, making the dropdown unable to show the selected value/s
     This pipe is used to show the selected value/s in the dropdown*/
export class AbstractFormControlCasterPipe implements PipeTransform {
  transform(formControl: AbstractControl): UntypedFormControl {
    return formControl as UntypedFormControl;
  }
}

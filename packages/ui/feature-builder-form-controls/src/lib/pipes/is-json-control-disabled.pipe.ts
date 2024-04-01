import { Pipe, PipeTransform } from '@angular/core';
import { FormControl } from '@angular/forms';
import { jsonEditorOptionsMonaco } from '@activepieces/ui/common';

@Pipe({
  name: 'isJsonControlDisabled',
  pure: true,
  standalone: true,
})
export class IsJsonControllerDisabledPipe implements PipeTransform {
  transform(formController: FormControl): typeof jsonEditorOptionsMonaco {
    return {
      ...jsonEditorOptionsMonaco,
      readOnly: formController.disabled,
    };
  }
}

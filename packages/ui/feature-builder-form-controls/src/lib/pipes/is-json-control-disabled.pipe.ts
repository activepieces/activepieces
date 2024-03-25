import { Pipe, PipeTransform } from '@angular/core';
import { FormControl } from '@angular/forms';
const jsonEditorOptions = {
  minimap: { enabled: false },
  theme: 'cobalt2',
  language: 'json',
  readOnly: false,
  automaticLayout: true,
  contextmenu: false,
  formatOnPaste: false,
  formatOnType: false,
};

@Pipe({
  name: 'isJsonControlDisabled',
  pure: true,
  standalone: true,
})
export class IsJsonControllerDisabledPipe implements PipeTransform {
  transform(formController: FormControl): typeof jsonEditorOptions {
    return {
      ...jsonEditorOptions,
      readOnly: formController.disabled,
    };
  }
}

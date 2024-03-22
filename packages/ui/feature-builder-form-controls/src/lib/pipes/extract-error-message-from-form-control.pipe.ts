import { Pipe, PipeTransform } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, map, startWith } from 'rxjs';
import { PieceProperty, PropertyType } from '@activepieces/pieces-framework';

@Pipe({
  name: 'extractControlErrorMessage',
  pure: true,
  standalone: true,
})
export class ExtractControlErrorMessagePipe implements PipeTransform {
  transform(
    ctrl: FormControl,
    property: PieceProperty,
    isDynamicInput: boolean
  ): Observable<string> {
    return ctrl.valueChanges.pipe(
      startWith(ctrl.value),
      map(() => {
        if (
          property.type === PropertyType.ARRAY &&
          property.properties !== undefined &&
          !isDynamicInput
        ) {
          return '';
        }
        if (ctrl.invalid && ctrl.hasError('required')) {
          return `${property.displayName} is required`;
        } else if (ctrl.invalid) {
          return `${property.displayName} is invalid`;
        }
        return '';
      })
    );
  }
}

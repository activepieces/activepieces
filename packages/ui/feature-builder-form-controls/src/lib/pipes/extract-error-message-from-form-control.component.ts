import { Pipe, PipeTransform } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, map, startWith, tap } from 'rxjs';

@Pipe({
  name: 'extractControlErrorMessage',
  pure: true,
  standalone: true,
})
export class ExtractControlErrorMessage implements PipeTransform {
  transform(ctrl: FormControl, propertyName: string): Observable<string> {
    return ctrl.valueChanges.pipe(
      startWith(ctrl.value),
      map(() => {
        if (ctrl.invalid && ctrl.hasError('required')) {
          return `${propertyName} is required`;
        } else if (ctrl.invalid) {
          return `${propertyName} is invalid`;
        }
        return '';
      }),
      tap(console.log),
    );
  }
}

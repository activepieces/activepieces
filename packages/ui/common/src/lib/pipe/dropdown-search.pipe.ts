import { Pipe, PipeTransform } from '@angular/core';
import { DropdownOption } from '@activepieces/pieces-framework';
import { FormControl } from '@angular/forms';
import { Observable, map, of, startWith } from 'rxjs';

@Pipe({
  name: 'dropdownSearch',
  pure: true,
})
export class DropdownPropertySearchPipe implements PipeTransform {
  transform(
    options: DropdownOption<unknown>[],
    search: FormControl<string>,
    searchIsDoneByBackend?: boolean
  ): Observable<DropdownOption<unknown>[]> {
    if (searchIsDoneByBackend) {
      return of(options);
    }
    return search.valueChanges.pipe(
      startWith(search.value),
      map((searchText) => {
        return options.filter((o) => {
          return o.label.toLowerCase().includes(searchText.toLowerCase());
        });
      })
    );
  }
}

import { Pipe, PipeTransform } from '@angular/core';
import { ConnectionDropdownItem } from '@activepieces/ui/feature-builder-store';

@Pipe({
  name: 'selectedAuthConfig',
  pure: true,
})
export class SelectedAuthConfigsPipe implements PipeTransform {
  transform(
    value: ConnectionDropdownItem[],
    pieceName: string,
    controlValue: string
  ): ConnectionDropdownItem | undefined {
    return value
      .filter(
        (item) => item.label.pieceName === pieceName || !item.label.pieceName
      )
      .find((item) => item.value === controlValue);
  }
}

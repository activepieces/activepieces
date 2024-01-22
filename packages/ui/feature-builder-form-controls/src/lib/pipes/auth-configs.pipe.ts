import { Pipe, PipeTransform } from '@angular/core';
import { ConnectionDropdownItem } from '@activepieces/ui/feature-builder-store';

@Pipe({
  name: 'authConfigsForPiece',
  pure: true,
})
export class AuthConfigsPipe implements PipeTransform {
  transform(
    value: ConnectionDropdownItem[],
    pieceName: string
  ): ConnectionDropdownItem[] {
    return value.filter(
      (item) => item.label.pieceName === pieceName || !item.label.pieceName
    );
  }
}

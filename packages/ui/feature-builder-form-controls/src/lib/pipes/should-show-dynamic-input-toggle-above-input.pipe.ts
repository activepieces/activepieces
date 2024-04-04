import { Pipe, PipeTransform } from '@angular/core';
import { PieceProperty, PropertyType } from '@activepieces/pieces-framework';

@Pipe({
  name: 'shouldShowDynamicInputToggleAboveInput',
  pure: true,
  standalone: true,
})
export class ShouldShowDynamicInputToggleAboveInputPipe
  implements PipeTransform
{
  transform(property: PieceProperty, isTrigger: boolean): boolean {
    const allowedTypes = [
      PropertyType.STATIC_DROPDOWN,
      PropertyType.DROPDOWN,
      PropertyType.STATIC_MULTI_SELECT_DROPDOWN,
      PropertyType.MULTI_SELECT_DROPDOWN,
      PropertyType.JSON,
    ];
    if (allowedTypes.includes(property.type)) {
      return true;
    }
    const authenticationTypes = [
      PropertyType.SECRET_TEXT,
      PropertyType.CUSTOM_AUTH,
      PropertyType.OAUTH2,
      PropertyType.BASIC_AUTH,
    ];
    if (!isTrigger && authenticationTypes.includes(property.type)) {
      return true;
    }
    return false;
  }
}

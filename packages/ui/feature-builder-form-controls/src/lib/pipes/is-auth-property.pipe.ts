import { Pipe, PipeTransform } from '@angular/core';
import { PieceProperty, PropertyType } from '@activepieces/pieces-framework';
const AUTH_PROPERTIES = [
  PropertyType.BASIC_AUTH,
  PropertyType.OAUTH2,
  PropertyType.SECRET_TEXT,
  PropertyType.CUSTOM_AUTH,
];
@Pipe({
  name: 'isAuthProperty',
  pure: true,
  standalone: true,
})
/**Since we are using virtual scrolling inside dropdown, this means that options don't get rendered until the dropdown is clicked, making the dropdown unable to show the selected value/s
     This pipe is used to show the selected value/s in the dropdown*/
export class IsAuthPropertyPipe implements PipeTransform {
  transform(property: PieceProperty): boolean {
    return AUTH_PROPERTIES.includes(property.type);
  }
}

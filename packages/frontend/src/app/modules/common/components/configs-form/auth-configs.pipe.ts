import { Pipe, PipeTransform } from '@angular/core';
import { OAuth2DropdownItem } from '../../model/dropdown-item.interface';

@Pipe({
	name: 'authConfigsForPiece',
	pure: true,
})
export class AuthConfigsPipe implements PipeTransform {
	transform(value: OAuth2DropdownItem[], pieceName: string): OAuth2DropdownItem[] {
		return value.filter(item => item.label.pieceName === pieceName || !item.label.pieceName);
	}
}

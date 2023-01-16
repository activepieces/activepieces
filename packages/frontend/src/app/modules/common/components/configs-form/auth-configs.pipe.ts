import { Pipe, PipeTransform } from '@angular/core';
import { ConnectionDropdownItem } from '../../model/dropdown-item.interface';

@Pipe({
	name: 'authConfigsForPiece',
	pure: true,
})
export class AuthConfigsPipe implements PipeTransform {
	transform(value: ConnectionDropdownItem[], pieceName: string): ConnectionDropdownItem[] {
		return value.filter(item => item.label.appName === pieceName || !item.label.appName);
	}
}

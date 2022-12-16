import { Pipe, PipeTransform } from '@angular/core';
import { DropdownOption } from '../../../model/dropdown-options';

@Pipe({
	name: 'itemText',
	pure: true,
})
export class ItemTextPipe implements PipeTransform {
	transform(value: string | DropdownOption) {
		if (typeof value === 'string') {
			return value;
		}
		return value.label;
	}
}

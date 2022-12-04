import { DropdownOption } from './dropdown-options';

export class DynamicDropdownResult {
	placeholder: string;
	disabled: boolean;
	options: DropdownOption[];
	loaded?: boolean = false;
	constructor() {}
}

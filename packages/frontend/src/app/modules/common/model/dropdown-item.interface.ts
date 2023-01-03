import { OAuth2Response } from 'shared';

export interface DropdownItem {
	label: any;
	value: any;
}

export interface OAuth2DropdownItem {
	label: { pieceName: string | null; configKey: string };
	value: OAuth2Response;
}

import type {InputDataType} from './input-data-type.model';
import type {InputRequestLocation} from './input-request-location.model';
import type {InputUiType} from './input-ui-type.model';

export type BasicInput<U extends InputUiType, V extends InputDataType> = {
	name: string;
	displayName: string;
	description: string | undefined;
	required: boolean;
	uiType: U;
	type: V;
	in: InputRequestLocation;
};

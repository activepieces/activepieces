import type {Authentication} from '../../common/authentication/core/authentication';
import type {BasicInput} from './basic-input.model';
import type {InputDataType} from './input-data-type.model';
import type {InputOption} from './input-option.model';
import type {InputUiType} from './input-ui-type.model';

export type SelectInput = BasicInput<InputUiType.SELECT, InputDataType.STRING> & {
	options: (auth: Authentication) => Promise<InputOption[]>;
};

import type {CheckboxInput} from './checkbox-input.model';
import type {NumberInput} from './number-input.model';
import type {LongTextInput} from './long-text-input.model';
import type {SelectInput} from './select-input.model';
import type {ShortTextInput} from './short-text-input.model';

export type Input =
    | ShortTextInput
    | LongTextInput
    | SelectInput
    | NumberInput
    | CheckboxInput;

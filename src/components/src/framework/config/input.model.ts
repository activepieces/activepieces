import type {BooleanInput} from './boolean-input.model';
import type {IntegerInput} from './integer-input.model';
import type {LongTextInput} from './long-text-input.model';
import type {SelectInput} from './select-input.model';
import type {ShortTextInput} from './short-text-input.model';

export type Input =
    | ShortTextInput
    | LongTextInput
    | SelectInput
    | IntegerInput
    | BooleanInput;

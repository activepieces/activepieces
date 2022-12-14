import type {BasicInput} from './basic-input.model';
import type {InputType} from './input-ui-type.model';
import {ConfigurationValue} from "./configuration-value.model";
import {InputOption} from "./input-option.model";

export type OAuth2Input = BasicInput<InputType.OAUTH2> & {
    authUrl: string;
    tokenUrl: string;
    scopes: string[];
};

import type {BasicInput} from './basic-input.model';
import {InputType} from "./input-type.model";

export type OAuth2Input = BasicInput<InputType.OAUTH2> & {
    authUrl: string;
    tokenUrl: string;
    scopes: string[];
};

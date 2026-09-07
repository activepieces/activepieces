import { TPropertyValue } from '../input/common';
import { PropertyType } from '../input/property-type';
import { BasePieceAuthSchema } from './common';

export type BasicAuthPropertyValue = {
  username: string;
  password: string;
}

export type BasicAuthProperty =
  BasePieceAuthSchema<BasicAuthPropertyValue> & {
    username: {
      displayName: string;
      description?: string;
    };
    password: {
      displayName: string;
      description?: string;
    };
  } &
  TPropertyValue<
    BasicAuthPropertyValue,
    PropertyType.BASIC_AUTH,
    true
  >;

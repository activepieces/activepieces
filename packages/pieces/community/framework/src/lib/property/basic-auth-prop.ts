import { PropertyType } from './property';
import { BasePieceAuthSchema, TPropertyValue } from './base-prop';
import { ValidationInputType } from '../validators/types';

export type BasicAuthPropertyValue = {
  username: string;
  password: string;
};

export type BasicAuthPropertySchema =
  BasePieceAuthSchema<BasicAuthPropertyValue> & {
    username: {
      displayName: string;
      description?: string;
    };
    password: {
      displayName: string;
      description?: string;
    };
  };

export type BasicAuthProperty<R extends boolean> = BasicAuthPropertySchema &
  TPropertyValue<
    BasicAuthPropertyValue,
    PropertyType.BASIC_AUTH,
    ValidationInputType.ANY,
    R
  >;

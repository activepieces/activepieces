import { Static, Type } from '@sinclair/typebox';
import { TPropertyValue } from '../input/common';
import { PropertyType } from '../input/property-type';
import { BasePieceAuthSchema } from './common';

export const BasicAuthPropertyValue = Type.Object({
  username: Type.String(),
  password: Type.String(),
})

export type BasicAuthPropertyValue = Static<typeof BasicAuthPropertyValue>

export const BasicAuthProperty = Type.Composite([
  BasePieceAuthSchema,
  Type.Object({
    username: Type.Object({
      displayName: Type.String(),
      description: Type.Optional(Type.String())
    }),
    password: Type.Object({
      displayName: Type.String(),
      description: Type.Optional(Type.String())
    })
  }),
  TPropertyValue(BasicAuthPropertyValue, PropertyType.BASIC_AUTH)
])

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


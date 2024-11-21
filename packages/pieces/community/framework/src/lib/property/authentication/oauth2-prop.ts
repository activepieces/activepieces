
import { OAuth2GrantType } from '@activepieces/shared';
import { Type } from '@sinclair/typebox';
import { ShortTextProperty } from '../input/text-property';
import { SecretTextProperty } from './secret-text-property';
import { BasePieceAuthSchema } from './common';
import { TPropertyValue } from '../input/common';
import { PropertyType } from '../input/property-type';
import { StaticDropdownProperty } from '../input/dropdown/static-dropdown';
import { StaticPropsValue } from '..';

export enum OAuth2AuthorizationMethod {
  HEADER = 'HEADER',
  BODY = 'BODY',
}

const OAuthProp = Type.Union([
  ShortTextProperty,
  SecretTextProperty,
  StaticDropdownProperty,
])

type OAuthProp =
  | ShortTextProperty<boolean>
  | SecretTextProperty<boolean>
  | StaticDropdownProperty<any, true>;


export const OAuth2Props = Type.Record(Type.String(), OAuthProp);

export type OAuth2Props = {
  [key: string]: OAuthProp;
}

type OAuthPropsValue<T extends OAuth2Props> = StaticPropsValue<T>;


const OAuth2ExtraProps = Type.Object({
  props: Type.Optional(Type.Record(Type.String(), OAuthProp)),
  authUrl: Type.String(),
  tokenUrl: Type.String(),
  scope: Type.Array(Type.String()),
  pkce: Type.Optional(Type.Boolean()),
  authorizationMethod: Type.Optional(Type.Enum(OAuth2AuthorizationMethod)),
  grantType: Type.Optional(Type.Enum(OAuth2GrantType)),
  extra: Type.Optional(Type.Record(Type.String(), Type.String()))
})

type OAuth2ExtraProps = {
  props?: OAuth2Props
  authUrl: string
  tokenUrl: string
  scope: string[]
  pkce?: boolean
  authorizationMethod?: OAuth2AuthorizationMethod
  grantType?: OAuth2GrantType
  extra?: Record<string, string>
}

export const OAuth2PropertyValue = Type.Object({
  access_token: Type.String(),
  props: Type.Optional(OAuth2Props),
  data: Type.Record(Type.String(), Type.Any())
})

export type OAuth2PropertyValue<T extends OAuth2Props = any> = {
  access_token: string;
  props?: OAuthPropsValue<T>;
  data: Record<string, any>;
};

export const OAuth2Property = Type.Composite([
  BasePieceAuthSchema,
  OAuth2ExtraProps,
  TPropertyValue(OAuth2PropertyValue, PropertyType.OAUTH2)
])

export type OAuth2Property<
  T extends OAuth2Props
> = BasePieceAuthSchema<OAuth2PropertyValue> &
  OAuth2ExtraProps &
  TPropertyValue<
    OAuth2PropertyValue<T>,
    PropertyType.OAUTH2,
    true
  >;


import {
  BOTH_CLIENT_CREDENTIALS_AND_AUTHORIZATION_CODE,
  OAuth2GrantType,
} from '@activepieces/shared';
import { z } from 'zod';
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

const OAuthProp = z.union([
  ShortTextProperty,
  SecretTextProperty,
  StaticDropdownProperty,
]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OAuthProp =
  | ShortTextProperty<boolean>
  | SecretTextProperty<boolean>
  | StaticDropdownProperty<any, boolean>;

export const OAuth2Props = z.record(z.string(), OAuthProp);

export type OAuth2Props = {
  [key: string]: OAuthProp;
};

type OAuthPropsValue<T extends OAuth2Props> = StaticPropsValue<T>;

const OAuth2ExtraProps = z.object({
  props: z.record(z.string(), OAuthProp).optional(),
  authUrl: z.string(),
  tokenUrl: z.string(),
  scope: z.array(z.string()),
  prompt: z
    .union([
      z.literal('none'),
      z.literal('consent'),
      z.literal('login'),
      z.literal('omit'),
    ])
    .optional(),
  pkce: z.boolean().optional(),
  pkceMethod: z.union([z.literal('plain'), z.literal('S256')]).optional(),
  authorizationMethod: z.nativeEnum(OAuth2AuthorizationMethod).optional(),
  grantType: z
    .union([
      z.nativeEnum(OAuth2GrantType),
      z.literal(BOTH_CLIENT_CREDENTIALS_AND_AUTHORIZATION_CODE),
    ])
    .optional(),
  extra: z.record(z.string(), z.string()).optional(),
});

type OAuth2ExtraProps = {
  props?: OAuth2Props;
  authUrl: string;
  tokenUrl: string;
  scope: string[];
  prompt?: 'none' | 'consent' | 'login' | 'omit';
  pkce?: boolean;
  pkceMethod?: 'plain' | 'S256';
  authorizationMethod?: OAuth2AuthorizationMethod;
  grantType?:
    | OAuth2GrantType
    | typeof BOTH_CLIENT_CREDENTIALS_AND_AUTHORIZATION_CODE;
  extra?: Record<string, string>;
};

export const OAuth2PropertyValue = z.object({
  access_token: z.string(),
  props: OAuth2Props.optional(),
  data: z.record(z.string(), z.unknown()),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type OAuth2PropertyValue<T extends OAuth2Props = any> = {
  access_token: string;
  props?: OAuthPropsValue<T>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
};

export const OAuth2Property = z.object({
  ...BasePieceAuthSchema.shape,
  ...OAuth2ExtraProps.shape,
  ...TPropertyValue(OAuth2PropertyValue, PropertyType.OAUTH2).shape,
});

export type OAuth2Property<T extends OAuth2Props> = BasePieceAuthSchema<
  OAuth2PropertyValue<T>
> &
  OAuth2ExtraProps &
  TPropertyValue<OAuth2PropertyValue<T>, PropertyType.OAUTH2, true>;

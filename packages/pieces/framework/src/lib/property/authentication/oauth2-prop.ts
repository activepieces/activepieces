import { BOTH_CLIENT_CREDENTIALS_AND_AUTHORIZATION_CODE, OAuth2GrantType } from '@activepieces/core-piece-types';
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OAuthProp =
  | ShortTextProperty<boolean>
  | SecretTextProperty<boolean>
  | StaticDropdownProperty<any, boolean>;

export type OAuth2Props = {
  [key: string]: OAuthProp;
}

type OAuthPropsValue<T extends OAuth2Props> = StaticPropsValue<T>;

type OAuth2ExtraProps = {
  props?: OAuth2Props
  authUrl: string
  tokenUrl: string
  scope: string[]
  prompt?: 'none' |  'consent' | 'login' | 'omit'
  pkce?: boolean
  pkceMethod?: 'plain' | 'S256'
  authorizationMethod?: OAuth2AuthorizationMethod
  grantType?: OAuth2GrantType | typeof BOTH_CLIENT_CREDENTIALS_AND_AUTHORIZATION_CODE
  extra?: Record<string, string>,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type OAuth2PropertyValue<T extends OAuth2Props = any> = {
  access_token: string;
  props?: OAuthPropsValue<T>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
};

export type OAuth2Property<
  T extends OAuth2Props
> = BasePieceAuthSchema<OAuth2PropertyValue<T>> &
  OAuth2ExtraProps &
  TPropertyValue<
    OAuth2PropertyValue<T>,
    PropertyType.OAUTH2,
    true
  >;

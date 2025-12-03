
import { Type } from "@sinclair/typebox";
import { BasicAuthProperty } from "./basic-auth-prop";
import { CustomAuthProperty, CustomAuthProps } from "./custom-auth-prop";
import { SecretTextProperty } from "./secret-text-property";
import { PropertyType } from "../input/property-type";
import { OAuth2Property, OAuth2Props } from "./oauth2-prop";
import { AppConnectionType, isNil } from "@activepieces/shared";

export const PieceAuthProperty = Type.Union([
  BasicAuthProperty,
  CustomAuthProperty,
  OAuth2Property,
  SecretTextProperty,
])

export type PieceAuthProperty = BasicAuthProperty | CustomAuthProperty<any> | OAuth2Property<any> | SecretTextProperty<boolean>;

type AuthProperties<T> = Omit<Properties<T>, 'displayName'> & {
  displayName?: string;
};

type Properties<T> = Omit<
  T,
  'valueSchema' | 'type' | 'defaultValidators' | 'defaultProcessors'
>;

export const DEFAULT_CONNECTION_DISPLAY_NAME = 'Connection';
export const PieceAuth = {
  SecretText<R extends boolean>(
    request: Properties<SecretTextProperty<R>>
  ): R extends true ? SecretTextProperty<true> : SecretTextProperty<false> {
    return {
      ...request,
      valueSchema: undefined,
      type: PropertyType.SECRET_TEXT,
    } as unknown as R extends true ? SecretTextProperty<true> : SecretTextProperty<false>;
  },
  OAuth2<T extends OAuth2Props>(
    request: AuthProperties<OAuth2Property<T>>
  ): OAuth2Property<T> {
    return {
      ...request,
      valueSchema: undefined,
      type: PropertyType.OAUTH2,
      displayName: request.displayName || DEFAULT_CONNECTION_DISPLAY_NAME,
    } as unknown as OAuth2Property<T>
  },
  BasicAuth(
    request: AuthProperties<BasicAuthProperty>
  ): BasicAuthProperty {
    return {
      ...request,
      valueSchema: undefined,
      type: PropertyType.BASIC_AUTH,
      displayName: request.displayName || DEFAULT_CONNECTION_DISPLAY_NAME,
      required: true,
    } as unknown as BasicAuthProperty;
  },
  CustomAuth<T extends CustomAuthProps>(
    request: AuthProperties<CustomAuthProperty<T>>
  ): CustomAuthProperty<T> {
    return {
      ...request,
      valueSchema: undefined,
      type: PropertyType.CUSTOM_AUTH,
      displayName: request.displayName || DEFAULT_CONNECTION_DISPLAY_NAME,
    } as unknown as CustomAuthProperty<T>
  },
  None() {
    return undefined;
  },
};

export type ExtractPieceAuthPropertyTypeForMethods<T extends PieceAuthProperty | PieceAuthProperty[] | undefined> = T extends PieceAuthProperty[] ? T[number] : T extends undefined ? undefined : T;

export function getAuthPropertyForValue({ authValueType, pieceAuth }: GetAuthPropertyForValue) {
  if (!Array.isArray(pieceAuth) || isNil(pieceAuth)) {
    return pieceAuth;
  }
  return pieceAuth.find(auth => authConnectionTypeToPropertyType[authValueType] === auth.type);
}

type GetAuthPropertyForValue = {
  authValueType: AppConnectionType
  pieceAuth: PieceAuthProperty | PieceAuthProperty[] | undefined
}

const authConnectionTypeToPropertyType: Record<AppConnectionType, PropertyType | undefined> = {
  [AppConnectionType.OAUTH2]: PropertyType.OAUTH2,
  [AppConnectionType.CLOUD_OAUTH2]: PropertyType.OAUTH2,
  [AppConnectionType.PLATFORM_OAUTH2]: PropertyType.OAUTH2,
  [AppConnectionType.BASIC_AUTH]: PropertyType.BASIC_AUTH,
  [AppConnectionType.CUSTOM_AUTH]: PropertyType.CUSTOM_AUTH,
  [AppConnectionType.SECRET_TEXT]: PropertyType.SECRET_TEXT,
  [AppConnectionType.NO_AUTH]: undefined,
}

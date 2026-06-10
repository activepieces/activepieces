export type Authentication = BearerTokenAuthentication | BasicAuthentication;

export enum AuthenticationType {
  BEARER_TOKEN = 'BEARER_TOKEN',
  BASIC = 'BASIC',
}

export type BaseAuthentication<T extends AuthenticationType> = {
  type: T;
};

export type BearerTokenAuthentication =
  BaseAuthentication<AuthenticationType.BEARER_TOKEN> & {
    token: string;
  };

export type BasicAuthentication =
  BaseAuthentication<AuthenticationType.BASIC> & {
    username: string;
    password: string;
  };

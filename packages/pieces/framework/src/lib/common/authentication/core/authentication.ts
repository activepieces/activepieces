import type {BasicAuthentication, BearerTokenAuthentication} from '../bearer-token/bearer-token-authentication';

export type Authentication = BearerTokenAuthentication | BasicAuthentication;

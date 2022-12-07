import type {AuthenticationType} from '../core/authentication-type';
import type {BaseAuthentication} from '../core/base-authentication';

export type BearerTokenAuthentication = BaseAuthentication<AuthenticationType.BEARER_TOKEN> & {
	token: string;
};

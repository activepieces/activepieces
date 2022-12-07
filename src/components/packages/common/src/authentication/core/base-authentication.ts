import type {AuthenticationType} from './authentication-type';

export type BaseAuthentication<T extends AuthenticationType> = {
	type: T;
};

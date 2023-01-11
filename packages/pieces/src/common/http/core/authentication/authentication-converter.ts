import type {Authentication} from '../../../authentication/core/authentication';
import type {HttpHeaders} from '../http-headers';

export type AuthenticationConverter = {
	convert: (authentication: Authentication, headers: HttpHeaders) => HttpHeaders;
};

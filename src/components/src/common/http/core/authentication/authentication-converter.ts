import type {Authentication} from '../../../authentication/core/authentication';
import type {RequestHeaders} from '../request-headers';

export type AuthenticationConverter = {
	convert: (authentication: Authentication, headers: RequestHeaders) => RequestHeaders;
};

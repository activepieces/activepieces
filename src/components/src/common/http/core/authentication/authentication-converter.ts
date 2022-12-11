import type {RequestHeaders} from '../request-headers';

import type {Authentication} from '../../../../authentication/core/authentication';

export type AuthenticationConverter = {
	convert: (authentication: Authentication, headers: RequestHeaders) => RequestHeaders;
};

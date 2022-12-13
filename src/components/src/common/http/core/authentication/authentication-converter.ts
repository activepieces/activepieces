<<<<<<< HEAD
import type {Authentication} from '../../../authentication/core/authentication';
import type {RequestHeaders} from '../request-headers';
=======
import type {RequestHeaders} from '../request-headers';

import type {Authentication} from '../../../../authentication/core/authentication';
>>>>>>> 20fa34b53dd559074baa1153d391b2f70b772889

export type AuthenticationConverter = {
	convert: (authentication: Authentication, headers: RequestHeaders) => RequestHeaders;
};

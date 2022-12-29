import type {Authentication} from '../../authentication/core/authentication';
import type {HttpMessageBody} from './http-message-body';
import type {HttpMethod} from './http-method';
import type {QueryParams} from './query-params';

export type HttpRequest<RequestBody extends HttpMessageBody> = {
	method: HttpMethod;
	url: string;
	body?: RequestBody | undefined;
	authentication?: Authentication | undefined;
	queryParams?: QueryParams | undefined;
};

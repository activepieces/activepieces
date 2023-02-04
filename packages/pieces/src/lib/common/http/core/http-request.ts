import type {Authentication} from '../../authentication/core/authentication';
import type {HttpMessageBody} from './http-message-body';
import type {HttpMethod} from './http-method';
import type {QueryParams} from './query-params';
import { HttpHeaders } from './http-headers';

export type HttpRequest = {
	method: HttpMethod;
	url: string;
	body?: HttpMessageBody | undefined;
	headers?: HttpHeaders;
	authentication?: Authentication | undefined;
	queryParams?: QueryParams | undefined;
};

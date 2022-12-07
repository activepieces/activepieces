import type {HttpHeader} from './http-header';

export type RequestHeaders = Partial<Record<HttpHeader, string | string[]>>;

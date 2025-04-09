import { Authentication } from '../../authentication'
import { HttpHeaders } from './http-headers'
import type { HttpMethod } from './http-method'
import { HttpRequestBody } from './http-request-body'
import type { QueryParams } from './query-params'

export type HttpRequest<RequestBody extends HttpRequestBody = any> = {
  method: HttpMethod
  url: string
  body?: RequestBody | undefined
  headers?: HttpHeaders
  authentication?: Authentication | undefined
  queryParams?: QueryParams | undefined
  timeout?: number
  retries?: number
  responseType?: 'arraybuffer' | 'json' | 'blob' | 'text'
}

import { HttpHeaders } from './http-headers'
import { HttpMessageBody } from './http-message-body'

export type HttpResponse<RequestBody extends HttpMessageBody = any> = {
  status: number
  headers?: HttpHeaders | undefined
  body: RequestBody
}

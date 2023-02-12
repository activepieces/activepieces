import { HttpMessageBody } from "../../../common/http/core/http-message-body"

export interface EventBody extends HttpMessageBody {
  api_key: string
  timestamp?: string
  category?: string
  distinct_id?: string
  context?: Record<string, unknown>
  properties?: Record<string, unknown>
  type:  "page"|"screen"|"capture"|"alias"
  event: "$create_alias"|"$event"|"$page"|"$screen"|"$identify"
  name?: string
  messageId?: string
}
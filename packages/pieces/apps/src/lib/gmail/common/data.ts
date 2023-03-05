import { AuthenticationType, httpClient, HttpMethod } from "@activepieces/framework"
import { GmailLabel, GmailMessageResponse } from "./models"

interface Props {
  access_token: string
  from: string
  to: string
  subject: string
  label: GmailLabel
  category: string
  after?: number
  before?: number
}

export const GmailRequests = {
  searchMail: async ({ access_token, from, to, subject, label, category, after, before }: Props) => {
    const queryParams = []
    
    if (from) queryParams.push(`from:(${from})`)
    if (to) queryParams.push(`to:(${from})`)
    if (subject) queryParams.push(`subject:(${subject})`)
    if (label) queryParams.push(`label:${label.name}`)
    if (category) queryParams.push(`category:${category}`)
    if (after != null) queryParams.push(`after:${after}`)
    if (before != null) queryParams.push(`before:${before}`)

    return await httpClient.sendRequest<GmailMessageResponse>({
      method: HttpMethod.GET,
      url: `https://www.googleapis.com/gmail/v1/users/me/messages`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: access_token
      },
      queryParams: {
        q: queryParams.join(" ")
      }
    })
  }
}
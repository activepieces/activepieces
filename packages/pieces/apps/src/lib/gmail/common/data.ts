import { AuthenticationType, httpClient, HttpMethod, OAuth2PropertyValue } from "@activepieces/framework"
import { GmailLabel, GmailMessage, GmailThread, GmailMessageFormat, GmailMessageResponse as GmailMessageList } from "./models"

interface SearchMailProps {
  access_token: string
  from: string
  to: string
  subject: string
  label: GmailLabel
  category: string
  after?: number
  before?: number
  max_results?: number
  page_token?: string
}

interface GetMailProps {
  authentication: OAuth2PropertyValue
  message_id?: string 
  thread_id?: string
  format: GmailMessageFormat
}

export const GmailRequests = {
  getMail: async ({ authentication, format, message_id }: GetMailProps) => {
    const response = await httpClient.sendRequest<GmailMessage>({
      method: HttpMethod.GET,
      url: `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: authentication['access_token'],
      },
      queryParams: {
        format
      }
    })

    console.debug("getMail response", response)

    return response.body
  },
  getThread: async ({ authentication, format, thread_id }: GetMailProps) => {
    const response = await httpClient.sendRequest<GmailThread>({
      method: HttpMethod.GET,
      url: `https://gmail.googleapis.com/gmail/v1/users/me/threads/${thread_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: authentication['access_token'],
      },
      queryParams: {
        format
      }
    })
    console.debug("getThread response", response)

    return response.body
  },
  getLabels: async (authentication: OAuth2PropertyValue) => {
    return await httpClient.sendRequest<{ labels: GmailLabel[] }>({
      method: HttpMethod.GET,
      url: `https://gmail.googleapis.com/gmail/v1/users/me/labels`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: (authentication as OAuth2PropertyValue).access_token
      }
    })
  },
  searchMail: async ({ access_token, max_results = 25, page_token:pageToken, ...mail}: SearchMailProps) => {
    const query = []
    
    if (mail.from) query.push(`from:(${mail.from})`)
    if (mail.to) query.push(`to:(${mail.to})`)
    if (mail.subject) query.push(`subject:(${mail.subject})`)
    if (mail.label) query.push(`label:${mail.label.name}`)
    if (mail.category) query.push(`category:${mail.category}`)
    if (mail.after != null) query.push(`after:${mail.after}`)
    if (mail.before != null) query.push(`before:${mail.before}`)

    const response = await httpClient.sendRequest<GmailMessageList>({
      method: HttpMethod.GET,
      url: `https://www.googleapis.com/gmail/v1/users/me/messages`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: access_token
      },
      queryParams: {
        q: query.join(" "),
        maxResults: `${max_results}`,
        ...(pageToken ? {pageToken} : {})
      }
    })

    console.log("searchMail response", response)
    return response.body
  }
}
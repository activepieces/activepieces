import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common'

export interface PageElement {
  objectId: string
  table?: {
    tableRows: any[]
  }
  sheetsChart?: {
    spreadsheetId: string
    chartId: number
  }
  shape?: {
    text: {
      textElements: { textRun: { content: string } }[]
    }
  }
}

export const googleSheetsCommon = {
  baseUrl: 'https://slides.googleapis.com/v1/presentations/',
  batchUpdate,
  getSlide,
  createSlide,
}

export async function batchUpdate(access_token: string, slide_id: string, requests: any) {
  return (
    await httpClient.sendRequest<{
      spreadsheetId: string
    }>({
      method: HttpMethod.POST,
      url: `https://slides.googleapis.com/v1/presentations/${slide_id}:batchUpdate`,
      body: {
        requests: requests,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: access_token,
      },
    })
  ).body
}

export async function getSlide(access_token: string, slide_id: string) {
  return (
    await httpClient.sendRequest<{
      presentationId: string
      title: string
      slides: {
        pageElements: any
        objectId: object
      }[]
    }>({
      method: HttpMethod.GET,
      url: `https://slides.googleapis.com/v1/presentations/${slide_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: access_token,
      },
    })
  ).body
}

export async function createSlide(access_token: string, requests: any) {
  return (
    await httpClient.sendRequest<{
      presentationId: string
      title: string
      spreadsheetId: string
      replies: any[]
    }>({
      method: HttpMethod.POST,
      url: `https://slides.googleapis.com/v1/presentations`,
      body: {
        requests: requests,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: access_token,
      },
    })
  ).body
}

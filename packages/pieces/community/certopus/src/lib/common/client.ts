import { HttpMessageBody, HttpMethod, QueryParams, httpClient } from '@activepieces/pieces-common'
import { certopusCommon } from '.'
import { Category } from './models/category'
import { Event } from './models/event'
import { Organisation } from './models/oranisation'
import { RecipientField } from './models/recipient-field'

export class CertopusClient {
  constructor(private token: string) {}

  async makeRequest<T extends HttpMessageBody = any>(
    method: HttpMethod,
    url: string,
    query?: QueryParams,
    body?: object,
  ): Promise<T> {
    const res = await httpClient.sendRequest({
      method,
      url: certopusCommon.baseUrl + url,
      queryParams: query,
      body,
      headers: {
        'x-api-key': this.token,
      },
    })
    return res.body.data
  }

  listOrganisations(): Promise<Organisation[]> {
    return this.makeRequest<Organisation[]>(HttpMethod.GET, '/organisations')
  }

  listEvents(organisationId: string): Promise<Event[]> {
    return this.makeRequest<Event[]>(HttpMethod.GET, `/events/${organisationId}`)
  }

  listCategories(organisationId: string, eventId: string): Promise<Category[]> {
    return this.makeRequest<Category[]>(HttpMethod.GET, '/categories', {
      organisationId,
      eventId,
    })
  }

  listRecipientFields(organisationId: string, eventId: string, categoryId: string): Promise<RecipientField[]> {
    return this.makeRequest<RecipientField[]>(HttpMethod.GET, '/recipient_fields', {
      organisationId,
      eventId,
      categoryId,
    })
  }
}

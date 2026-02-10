import {
  HttpMessageBody,
  HttpMethod,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';

function emptyValueFilter(
  accessor: (key: string) => any
): (key: string) => boolean {
  return (key: string) => {
    const val = accessor(key);
    return (
      val !== null &&
      val !== undefined &&
      (typeof val != 'string' || val.length > 0)
    );
  };
}

type ResponseSchema = {
  data: {
    id: string;
    type: string;
    attributes: unknown
    relationships: unknown
  }[];
}

export function prepareQuery(request?: Record<string, any>): QueryParams {
  const params: QueryParams = {};
  if (!request) return params;
  Object.keys(request)
    .filter(emptyValueFilter((k) => request[k]))
    .forEach((k: string) => {
      params[k] = (request as Record<string, any>)[k];
    });
  return params;
}

export class PredictLeadsClient {
  constructor(private apiKey: string, private apiToken: string) { }

  async makeRequest<T extends HttpMessageBody>(
    method: HttpMethod,
    resourceUri: string,
    query?: QueryParams,
    body: any | undefined = undefined
  ): Promise<T> {
    const baseUrl = 'https://predictleads.com'

    const res = await httpClient.sendRequest<T>({
      method: method,
      url: `${baseUrl}/api` + resourceUri,
      headers: {
        'X-Api-Key': this.apiKey,
        'X-Api-Token': this.apiToken,
      },
      queryParams: query,
      body: body,
    });
    return res.body;
  }

  async findCompanies(query?: QueryParams) {
    return await this.makeRequest<ResponseSchema>(HttpMethod.GET, '/v3/discover/companies', query)
  }

  async findCompanyByDomain(domain: string) {
    return await this.makeRequest<ResponseSchema>(HttpMethod.GET, `/v3/companies/${domain}`);
  }

  async findCompanyJobOpenings(companyId: string, query: QueryParams) {
    return await this.makeRequest<ResponseSchema>(HttpMethod.GET, `/v3/companies/${companyId}/job_openings`, query);
  }

  async getAJobOpeningById(jobOpeningId: string) {
    return await this.makeRequest<ResponseSchema>(HttpMethod.GET, `/v3/job_openings/${jobOpeningId}`);
  }

  async findJobOpenings(query?: QueryParams) {
    return await this.makeRequest<ResponseSchema>(HttpMethod.GET, `/v3/discover/job_openings`, query);
  }

  async findTechnologies(domain: string, query?: QueryParams) {
    return await this.makeRequest<ResponseSchema>(HttpMethod.GET, `/v3/companies/${domain}/technology_detections`, query);
  }

  async findCompaniesTechnologyById(technologyId: string, query?: QueryParams) {
    return await this.makeRequest<ResponseSchema>(HttpMethod.GET, `/v3/discover/technologies/${technologyId}/technology_detections`, query);
  }

  async findNewsByDomain(domain: string, query?: QueryParams) {
    return await this.makeRequest<ResponseSchema>(HttpMethod.GET, `/v3/companies/${domain}/news_events`, query);
  }

  async findNewsEventById(newsEventId: string) {
    return await this.makeRequest<ResponseSchema>(HttpMethod.GET, `/v3/news_events/${newsEventId}`);
  }

  async findConnectionsByDomain(domain: string, query?: QueryParams) {
    return await this.makeRequest<ResponseSchema>(HttpMethod.GET, `/v3/companies/${domain}/connections`, query);
  }

  async findConnections(query?: QueryParams) {
    return await this.makeRequest<ResponseSchema>(HttpMethod.GET, `/v3/discover/portfolio_companies/connections`, query);
  }
}

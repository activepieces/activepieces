import {
  AuthenticationType,
  HttpHeaders,
  HttpMessageBody,
  HttpMethod,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';
import { EntityAttributeType } from './constants';
import {
  EntityAttributeOptionsResponse,
  EntityAttributeResponse,
  EntityTypeAttributesResponse,
  EntityTypeResponse,
} from './types';
import { getBaseUrl } from '../..';

export class DynamicsCRMClient {
  constructor(
    private hostUrl: string,
    private accessToken: string,
    private proxyUrl?: string
  ) {}
  async makeRequest<T extends HttpMessageBody>(
    method: HttpMethod,
    resourceUri: string,
    headers?: HttpHeaders,
    query?: QueryParams,
    body: any | undefined = undefined
  ): Promise<T> {
    const baseUrl = getBaseUrl(this.hostUrl.replace(/\/$/, ''), this.proxyUrl);
    const res = await httpClient.sendRequest<T>({
      method: method,
      url: `${baseUrl}/api/data/v9.2` + resourceUri,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: this.accessToken,
      },
      headers: {
        Accept: 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        'Content-Type': 'application/json',
        ...headers,
      },
      queryParams: query,
      body: body,
    });
    return res.body;
  }

  async createRecord(entityUrlPath: string, request: unknown) {
    return await this.makeRequest(
      HttpMethod.POST,
      `/${entityUrlPath}`,
      {
        // return created data in response
        // docs: https://learn.microsoft.com/en-us/previous-versions/dynamicscrm-2016/developers-guide/gg328090(v=crm.8)#create-with-data-returned
        Prefer: 'return=representation',
      },
      undefined,
      request
    );
  }

  async updatedRecord(
    entityUrlPath: string,
    recordId: string,
    request: unknown
  ) {
    return await this.makeRequest(
      HttpMethod.PATCH,
      `/${entityUrlPath}(${recordId})`,
      {
        // return created data in response
        // docs: https://learn.microsoft.com/en-us/previous-versions/dynamicscrm-2016/developers-guide/mt607664(v=crm.8)#update-with-data-returned
        Prefer: 'return=representation',
      },
      undefined,
      request
    );
  }

  async getRecord(entityUrlPath: string, recordId: string) {
    return await this.makeRequest(
      HttpMethod.GET,
      `/${entityUrlPath}(${recordId})`
    );
  }

  async deleteRecord(entityUrlPath: string, recordId: string) {
    return await this.makeRequest(
      HttpMethod.DELETE,
      `/${entityUrlPath}(${recordId})`
    );
  }
  async fetchEntityTypes(): Promise<EntityTypeResponse> {
    // fetch entity type data
    return await this.makeRequest<EntityTypeResponse>(
      HttpMethod.GET,
      `/EntityDefinitions`,
      undefined,
      {
        $select: ['EntitySetName', 'LogicalName'].join(','),
      }
    );
  }
  async fetchEntityTypeAttributes(
    entitySetName: string
  ): Promise<EntityTypeAttributesResponse> {
    return await this.makeRequest<EntityTypeAttributesResponse>(
      HttpMethod.GET,
      `/EntityDefinitions`,
      undefined,
      {
        $select: [
          'PrimaryIdAttribute',
          'PrimaryNameAttribute',
          'LogicalName',
        ].join(','),
        $filter: `EntitySetName eq '${entitySetName}'`,
      }
    );
  }
  async fetchEntityAttributes(
    entityName: string
  ): Promise<EntityAttributeResponse> {
    // fetch entity attribute data
    // docs: https://learn.microsoft.com/en-us/previous-versions/dynamicscrm-2016/developers-guide/mt788314(v=crm.8)#retrieve-metadata-items-by-name
    return await this.makeRequest<EntityAttributeResponse>(
      HttpMethod.GET,
      `/EntityDefinitions(LogicalName='${entityName}')/Attributes`,
      undefined,
      {
        $select: [
          'AttributeType',
          'LogicalName',
          'Description',
          'DisplayName',
          'IsPrimaryName',
          'IsValidForCreate',
        ].join(','),
      }
    );
  }

  async fetchOptionFieldValues(
    entityName: string,
    entityAttributeName: string,
    entityAttributeType: EntityAttributeType
  ): Promise<{ label: string; value: string | number }[]> {
    const res = await this.makeRequest<EntityAttributeOptionsResponse>(
      HttpMethod.GET,
      `/EntityDefinitions(LogicalName='${entityName}')/Attributes(LogicalName='${entityAttributeName}')/Microsoft.Dynamics.CRM.${entityAttributeType}AttributeMetadata`,
      undefined,
      {
        $select: 'LogicalName',
        $expand: 'OptionSet($select=Options),GlobalOptionSet($select=Options)',
      }
    );
    const optionSet = res.OptionSet ?? res.GlobalOptionSet;
    const options: { label: string; value: string | number }[] =
      optionSet?.Options?.map(({ Value, Label }) => ({
        value: Value,
        label: Label.UserLocalizedLabel.Label ?? String(Value),
      })) || [];
    return options;
  }
}

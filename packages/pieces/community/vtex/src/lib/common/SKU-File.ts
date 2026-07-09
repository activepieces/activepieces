import { httpClient, HttpMethod } from '@activepieces/pieces-common';

type CreateSkuFileParams = {
  IsMain?: boolean;
  Label?: string;
  Name: string;
  Text?: string;
  Url: string;
};

type UpdateSkuFileParams = {
  Id: number;
  SkuId: number;
  FieldId: number;
  FieldValueId: number;
  Text: string;
};

export class SkuFile {
  private baseURL: string;
  private headers: Record<string, string>;

  constructor(host: string, appKey: string, appToken: string) {
    this.baseURL = 'https://' + host;
    this.headers = {
      'X-VTEX-API-AppKey': appKey,
      'X-VTEX-API-AppToken': appToken,
    };
  }

  async getSkuFilesBySkuId(skuID: number) {
    const route = `/api/catalog/pvt/stockkeepingunit/${skuID}/file/`;
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: this.baseURL + route,
      headers: this.headers,
    });
    return response.body;
  }

  async createSkuFile(skuID: number, newSkuFileData: CreateSkuFileParams) {
    const route = `/api/catalog/pvt/stockkeepingunit/${skuID}/file`;
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: this.baseURL + route,
      headers: this.headers,
      body: newSkuFileData,
    });
    return response.body;
  }

  async updateSkuFile(
    skuID: number,
    skuFileID: number,
    updatedSkuFileData: UpdateSkuFileParams
  ) {
    const route = `/api/catalog/pvt/stockkeepingunit/${skuID}/file/${skuFileID}`;
    const response = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: this.baseURL + route,
      headers: this.headers,
      body: updatedSkuFileData,
    });
    return response.body;
  }
}

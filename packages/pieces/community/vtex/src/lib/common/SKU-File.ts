import axios, { Axios } from 'axios';

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
  api: Axios;

  constructor(host: string, appKey: string, appToken: string) {
    this.api = axios.create({
      baseURL: 'https://' + host,
      headers: {
        'X-VTEX-API-AppKey': appKey,
        'X-VTEX-API-AppToken': appToken,
      },
    });
  }

  async getSkuFilesBySkuId(skuID: number) {
    const route = `/api/catalog/pvt/stockkeepingunit/${skuID}/file/`;
    const response = await this.api.get(route);
    return response.data;
  }

  async createSkuFile(skuID: number, newSkuFileData: CreateSkuFileParams) {
    const route = `/api/catalog/pvt/stockkeepingunit/${skuID}/file`;
    const response = await this.api.post(route, newSkuFileData);
    return response.data;
  }

  async updateSkuFile(
    skuID: number,
    skuFileID: number,
    updatedSkuFileData: UpdateSkuFileParams
  ) {
    const route = `/api/catalog/pvt/stockkeepingunit/${skuID}/file/${skuFileID}`;
    const response = await this.api.put(route, updatedSkuFileData);
    return response.data;
  }
}

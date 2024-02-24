// import {
//   HttpMessageBody,
//   HttpMethod,
//   HttpRequest,
//   QueryParams,
//   httpClient,
// } from '@activepieces/pieces-common';

// function emptyValueFilter(accessor: (key: string) => any): (key: string) => boolean {
//   return (key: string) => {
//     const val = accessor(key);
//     return val !== null && val !== undefined && (typeof val != 'string' || val.length > 0);
//   };
// }

// export function prepareQuery(request?: Record<string, any>): QueryParams {
//   const params: QueryParams = {};
//   if (!request) return params;
//   Object.keys(request)
//     .filter(emptyValueFilter((k) => request[k]))
//     .forEach((k: string) => {
//       params[k] = (request as Record<string, any>)[k].toString();
//     });
//   return params;
// }

// export class AcumbamailClient {
//   constructor(private authToken: string) {}
//   async makeRequest<T extends HttpMessageBody>(
//     method: HttpMethod,
//     url: string,
//     query?: QueryParams,
//     body?: object
//   ): Promise<T> {
//     const request: HttpRequest = {
//       method,
//       url: 'https://acumbamail.com/api/1' + url,
//     };
//     const res = await httpClient.sendRequest<T>({
//       method,
//       url: 'https://acumbamail.com/api/1' + url,
//       queryParams: { auth_token: this.authToken, ...query },
//       body,
//     });
//     return res.body;
//   }
//   //   async createList(request: CreateListParams) {
//   //     return await this.makeRequest(HttpMethod.POST, '/createList/', prepareQuery(request));
//   //   }
//   //   async deleteList(listId: number) {
//   //     return await this.makeRequest(
//   //       HttpMethod.DELETE,
//   //       '/deleteList/',
//   //       prepareQuery({ list_id: listId })
//   //     );
//   //   }
//   //   async getLists(): Promise<GetListsResponse> {
//   //     return await this.makeRequest<GetListsResponse>(HttpMethod.GET, '/getLists/');
//   //   }
//   //   async getListFields(listId: number) {
//   //     return await this.makeRequest<{ fields: SubscriberListField[] }>(
//   //       HttpMethod.GET,
//   //       '/getListFields/',
//   //       prepareQuery({ list_id: listId })
//   //     );
//   //   }
// }

import { QueryParams } from '@activepieces/pieces-common';

export interface ActionResponse {
  success: boolean;
}

export interface ListRequest {
  page?: number;
  page_size?: number;
  search?: string;
  filter?: Record<string, any>;
}

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

export function prepareQueryRequest(
  request?: ListRequest | Record<string, any | undefined>
): QueryParams {
  const params: QueryParams = {};
  if (!request) return params;
  const requestObj = request as Record<string, any>;
  Object.keys(request)
    .filter((k) => k != 'filter')
    .filter(emptyValueFilter((k) => requestObj[k]))
    .forEach((k: string) => {
      params[k] = (request as Record<string, any>)[k].toString();
    });
  if (request.filter) {
    const filter = request.filter; // For some reason required to pass the unidentified check
    Object.keys(request.filter)
      .filter(emptyValueFilter((k) => filter[k]))
      .forEach((k) => {
        params['filter[' + k + ']'] = filter[k].toString();
      });
  }
  return params;
}

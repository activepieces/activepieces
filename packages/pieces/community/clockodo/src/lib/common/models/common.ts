import { QueryParams } from '@activepieces/pieces-common';

export interface Paging {
  items_per_page: number;
  current_page: number;
  count_pages: number;
  count_items: number;
}

export interface ListRequest<T extends object> {
  page?: number;
  filter?: T;
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

export function prepareListRequest(request: ListRequest<any>): QueryParams {
  const params: QueryParams = {};
  const requestObj = request as Record<string, any>;
  Object.keys(request)
    .filter((k) => k != 'filter')
    .filter(emptyValueFilter((k) => requestObj[k]))
    .forEach((k: string) => {
      params[k] = (request as Record<string, any>)[k].toString();
    });
  if (request.filter) {
    Object.keys(request.filter)
      .filter(emptyValueFilter((k) => request.filter[k]))
      .forEach((k) => {
        params['filter[' + k + ']'] = request.filter[k].toString();
      });
  }
  return params;
}

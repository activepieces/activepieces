import { QueryParams } from "@activepieces/pieces-common"

export interface Paging {
    items_per_page: number,
    current_page: number,
    count_pages: number,
    count_items: number
}

export interface ListRequest<T extends object> {
    page?: number,
    filter?: T
}

export function prepareListRequest(request: ListRequest<any>): QueryParams {
    const params: QueryParams = {}
    if(request.page)
        params.page = request.page.toString() 
    Object.keys(request.filter).filter(k => request.filter[k] !== null && request.filter[k] !== undefined && request.filter[k].length > 0).forEach(k => {
        params['filter[' + k + ']'] = request.filter[k].toString()
    })
    return params
}
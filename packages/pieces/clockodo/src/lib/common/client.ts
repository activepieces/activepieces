import { HttpMessageBody, HttpMethod, QueryParams, httpClient } from "@activepieces/pieces-common"
import { ListRequest, prepareListRequest } from './models/common'
import { CustomerSingleResponse, CustomerListResponse, CustomerCreateRequest, CustomerUpdateRequest, CustomerListFilter, Customer } from './models/customer'
import { ProjectSingleResponse, ProjectListResponse, ProjectCreateRequest, ProjectUpdateRequest, ProjectListFilter, Project } from './models/project'

export class ClockodoClient {

    private clientIdentification: string
    private language = 'en'

    constructor(private email: string, private token: string, clientName: string, clientEmail: string) {
        this.clientIdentification = clientName + ';' + clientEmail
    }

    setLanguage(language: string) {
        this.language = language
    }

    async makeRequest<T extends HttpMessageBody>(method: HttpMethod, url: string, query?: QueryParams, body?: object): Promise<T> {
        const res = await httpClient.sendRequest<T>({
            method,
            url: 'https://my.clockodo.com/api' + url,
            queryParams: query,
            body,
            headers: {
                'X-ClockodoApiUser': this.email,
                'X-ClockodoApiKey': this.token,
                'X-Clockodo-External-Application': this.clientIdentification,
                'Accept-Language': this.language
            }
        })
        return res.body
    }

    listCustomers(request: ListRequest<CustomerListFilter> = {}): Promise<CustomerListResponse> {
        return this.makeRequest<CustomerListResponse>(HttpMethod.GET, '/v2/customers', prepareListRequest(request))
    }

    async listAllCustomers(filter: CustomerListFilter = {}): Promise<Customer[]> {
        let totalPages = 999999
        const all: Customer[] = []
        for(let page=0; page < totalPages; page++) {
            const res = await this.listCustomers({
                page: page + 1,
                filter
            })
            totalPages = res.paging.count_pages
            res.customers.forEach(e => all.push(e))
        }
        return all
    }

    getCustomer(id: number): Promise<CustomerSingleResponse> {
        return this.makeRequest<CustomerSingleResponse>(HttpMethod.GET, '/v2/customers/' + id)
    }

    createCustomer(request: CustomerCreateRequest) {
        return this.makeRequest<CustomerSingleResponse>(HttpMethod.POST, '/v2/customers', undefined, request)
    }

    updateCustomer(id: number, request: CustomerUpdateRequest): Promise<CustomerSingleResponse> {
        return this.makeRequest<CustomerSingleResponse>(HttpMethod.PUT, '/v2/customers/' + id, undefined, request)
    }

    deleteCustomer(id: number): Promise<object> {
        return this.makeRequest<object>(HttpMethod.DELETE, '/v2/customers/' + id)
    }

    listProjects(request: ListRequest<ProjectListFilter> = {}): Promise<ProjectListResponse> {
        return this.makeRequest<ProjectListResponse>(HttpMethod.GET, '/v2/projects', prepareListRequest(request))
    }

    async listAllProjects(filter: ProjectListFilter = {}): Promise<Project[]> {
        let totalPages = 999999
        const all: Project[] = []
        for(let page=0; page < totalPages; page++) {
            const res = await this.listProjects({
                page: page + 1,
                filter
            })
            totalPages = res.paging.count_pages
            res.projects.forEach(e => all.push(e))
        }
        return all
    }

    getProject(id: number): Promise<ProjectSingleResponse> {
        return this.makeRequest<ProjectSingleResponse>(HttpMethod.GET, '/v2/projects/' + id)
    }

    createProject(request: ProjectCreateRequest) {
        return this.makeRequest<ProjectSingleResponse>(HttpMethod.POST, '/v2/projects', undefined, request)
    }

    updateProject(id: number, request: ProjectUpdateRequest): Promise<ProjectSingleResponse> {
        return this.makeRequest<ProjectSingleResponse>(HttpMethod.PUT, '/v2/projects/' + id, undefined, request)
    }

    deleteProject(id: number): Promise<object> {
        return this.makeRequest<object>(HttpMethod.DELETE, '/v2/projects/' + id)
    }

}
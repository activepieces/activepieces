import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

export interface MyCaseApiResponse<T = any> {
  data: T;
}

export class MyCaseClient {
  constructor(private auth: OAuth2PropertyValue) {}

  private async makeRequest<T>(
    method: HttpMethod,
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    const response = await httpClient.sendRequest<MyCaseApiResponse<T>>({
      method,
      url: `https://api.mycase.com/v1/${endpoint}`,
      headers: {
        Authorization: `Bearer ${this.auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    return response.body.data || response.body as T;
  }

  async createCase(data: unknown) {
    return this.makeRequest('POST', 'cases', data);
  }

  async updateCase(id: string, data: unknown) {
    return this.makeRequest('PUT', `cases/${id}`, data);
  }

  async createLead(data: unknown) {
    return this.makeRequest('POST', 'leads', data);
  }

  async createPerson(data: unknown) {
    return this.makeRequest('POST', 'contacts/people', data);
  }

  async updatePerson(id: string, data: unknown) {
    return this.makeRequest('PUT', `contacts/people/${id}`, data);
  }

  async createCompany(data: unknown) {
    return this.makeRequest('POST', 'contacts/companies', data);
  }

  async updateCompany(id: string, data: unknown) {
    return this.makeRequest('PUT', `contacts/companies/${id}`, data);
  }

  async createCaseStage(data: unknown) {
    return this.makeRequest('POST', 'case_stages', data);
  }

  async createCustomField(data: unknown) {
    return this.makeRequest('POST', 'custom_fields', data);
  }

  async createDocument(data: unknown) {
    return this.makeRequest('POST', 'documents', data);
  }

  async createEvent(data: unknown) {
    return this.makeRequest('POST', 'events', data);
  }

  async createExpense(data: unknown) {
    return this.makeRequest('POST', 'expenses', data);
  }

  async createLocation(data: unknown) {
    return this.makeRequest('POST', 'locations', data);
  }

  async createNote(data: unknown) {
    return this.makeRequest('POST', 'notes', data);
  }

  async createPracticeArea(data: unknown) {
    return this.makeRequest('POST', 'practice_areas', data);
  }

  async createReferralSource(data: unknown) {
    return this.makeRequest('POST', 'referral_sources', data);
  }

  async createTask(data: unknown) {
    return this.makeRequest('POST', 'tasks', data);
  }

  async createTimeEntry(data: unknown) {
    return this.makeRequest('POST', 'time_entries', data);
  }

  async createCall(data: unknown) {
    return this.makeRequest('POST', 'calls', data);
  }

  async findCase(params: Record<string, unknown>) {
    const queryString = new URLSearchParams(params as any).toString();
    return this.makeRequest('GET', `cases?${queryString}`);
  }

  async findCaller(params: Record<string, unknown>) {
    const queryString = new URLSearchParams(params as any).toString();
    return this.makeRequest('GET', `callers?${queryString}`);
  }

  async findCaseStage(params: Record<string, unknown>) {
    const queryString = new URLSearchParams(params as any).toString();
    return this.makeRequest('GET', `case_stages?${queryString}`);
  }

  async findCompanyContact(params: Record<string, unknown>) {
    const queryString = new URLSearchParams(params as any).toString();
    return this.makeRequest('GET', `contacts/companies?${queryString}`);
  }

  async findLocation(params: Record<string, unknown>) {
    const queryString = new URLSearchParams(params as any).toString();
    return this.makeRequest('GET', `locations?${queryString}`);
  }

  async findPeopleGroup(params: Record<string, unknown>) {
    const queryString = new URLSearchParams(params as any).toString();
    return this.makeRequest('GET', `people_groups?${queryString}`);
  }

  async findPersonContact(params: Record<string, unknown>) {
    const queryString = new URLSearchParams(params as any).toString();
    return this.makeRequest('GET', `contacts/people?${queryString}`);
  }

  async findPracticeArea(params: Record<string, unknown>) {
    const queryString = new URLSearchParams(params as any).toString();
    return this.makeRequest('GET', `practice_areas?${queryString}`);
  }

  async findReferralSource(params: Record<string, unknown>) {
    const queryString = new URLSearchParams(params as any).toString();
    return this.makeRequest('GET', `referral_sources?${queryString}`);
  }

  async findStaff(params: Record<string, unknown>) {
    const queryString = new URLSearchParams(params as any).toString();
    return this.makeRequest('GET', `staff?${queryString}`);
  }
}


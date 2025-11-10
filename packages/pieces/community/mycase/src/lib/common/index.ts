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
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
    const queryString = new URLSearchParams(filteredParams as any).toString();
    return this.makeRequest('GET', queryString ? `cases?${queryString}` : 'cases');
  }

  async findCaller(params: Record<string, unknown>) {
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
    const queryString = new URLSearchParams(filteredParams as any).toString();
    return this.makeRequest('GET', queryString ? `callers?${queryString}` : 'callers');
  }

  async findCaseStage(params: Record<string, unknown>) {
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
    const queryString = new URLSearchParams(filteredParams as any).toString();
    return this.makeRequest('GET', queryString ? `case_stages?${queryString}` : 'case_stages');
  }

  async findCompanyContact(params: Record<string, unknown>) {
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
    const queryString = new URLSearchParams(filteredParams as any).toString();
    return this.makeRequest('GET', queryString ? `contacts/companies?${queryString}` : 'contacts/companies');
  }

  async findLocation(params: Record<string, unknown>) {
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
    const queryString = new URLSearchParams(filteredParams as any).toString();
    return this.makeRequest('GET', queryString ? `locations?${queryString}` : 'locations');
  }

  async findPeopleGroup(params: Record<string, unknown>) {
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
    const queryString = new URLSearchParams(filteredParams as any).toString();
    return this.makeRequest('GET', queryString ? `people_groups?${queryString}` : 'people_groups');
  }

  async findPersonContact(params: Record<string, unknown>) {
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
    const queryString = new URLSearchParams(filteredParams as any).toString();
    return this.makeRequest('GET', queryString ? `contacts/people?${queryString}` : 'contacts/people');
  }

  async findPracticeArea(params: Record<string, unknown>) {
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
    const queryString = new URLSearchParams(filteredParams as any).toString();
    return this.makeRequest('GET', queryString ? `practice_areas?${queryString}` : 'practice_areas');
  }

  async findReferralSource(params: Record<string, unknown>) {
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
    const queryString = new URLSearchParams(filteredParams as any).toString();
    return this.makeRequest('GET', queryString ? `referral_sources?${queryString}` : 'referral_sources');
  }

  async findStaff(params: Record<string, unknown>) {
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
    const queryString = new URLSearchParams(filteredParams as any).toString();
    return this.makeRequest('GET', queryString ? `staff?${queryString}` : 'staff');
  }

  async findLead(params: Record<string, unknown>) {
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
    const queryString = new URLSearchParams(filteredParams as any).toString();
    return this.makeRequest('GET', queryString ? `leads?${queryString}` : 'leads');
  }
}


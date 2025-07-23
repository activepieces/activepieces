import axios, { AxiosInstance } from 'axios';

export class SystemeioApiClient {
  private client: AxiosInstance;

  constructor(apiKey: string) {
    this.client = axios.create({
      baseURL: 'https://api.systeme.io', // Update if the base URL is different
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  // Example: Get contacts
  async getContacts(params?: Record<string, any>) {
    return this.client.get('/contacts', { params });
  }

  // Add more methods for other endpoints as needed

  public async postContact(data: any) {
    const response = await this.client.post('/contacts', data);
    return response.data;
  }

  public async updateContact(contactId: string, data: any) {
    const response = await this.client.patch(`/contacts/${contactId}`, data);
    return response.data;
  }

  public async addTagToContact(contactId: string, tag: string) {
    const response = await this.client.post(`/contacts/${contactId}/tags`, { name: tag });
    return response.data;
  }

  public async removeTagFromContact(contactId: string, tag: string) {
    // If API requires tag ID, you may need to look up the tag by name first
    const response = await this.client.delete(`/contacts/${contactId}/tags/${tag}`);
    return response.data;
  }

  public async findContactByEmail(email: string) {
    const response = await this.client.get('/contacts', { params: { email } });
    return response.data;
  }

  public async getSales(params?: Record<string, any>) {
    const response = await this.client.get('/sales', { params });
    return response.data;
  }
} 
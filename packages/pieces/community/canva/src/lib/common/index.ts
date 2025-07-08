import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

export const canvaCommon = {
  baseUrl: 'https://api.canva.com/rest/v1',
  
  async makeRequest(
    auth: OAuth2PropertyValue,
    method: string,
    endpoint: string,
    body?: any
  ) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Canva API Error: ${response.status} - ${await response.text()}`);
    }

    return response.json();
  },

  async uploadFile(
    auth: OAuth2PropertyValue,
    file: Buffer,
    filename: string,
    mimeType: string
  ) {
    const formData = new FormData();
    formData.append('file', new Blob([file], { type: mimeType }), filename);

    const response = await fetch(`${this.baseUrl}/assets/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${auth.access_token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Canva Upload Error: ${response.status} - ${await response.text()}`);
    }

    return response.json();
  }
};
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { ValidationResult } from "../types";

export class ScrapelessValidator {

  static async validateApiKey(apiKey: string): Promise<ValidationResult> {
    const errors: string[] = [];

    if (!apiKey) {
      errors.push('API key is required');
    } else if (typeof apiKey !== 'string') {
      errors.push('API key must be a string');
    }

    const response =await httpClient.sendRequest({
      url: 'https://api.scrapeless.com/api/v1/me',
      method: HttpMethod.GET,
      headers:{
        'x-api-token':apiKey
      }
    });

    if(response.status !== 200) {
      errors.push('Invalid API key');
    }
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

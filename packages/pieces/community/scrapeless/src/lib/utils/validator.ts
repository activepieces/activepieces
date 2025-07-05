import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { ValidationResult } from "../types";
import { SCRAPEELESS_API_KEY_VALIDATION_URL } from "../constants";

export class ScrapelessValidator {

  static async validateApiKey(apiKey: string): Promise<ValidationResult> {
    const errors: string[] = [];

    if (!apiKey) {
      errors.push('API key is required');
    } else if (typeof apiKey !== 'string') {
      errors.push('API key must be a string');
    }

    const response =await httpClient.sendRequest({
      url: `${SCRAPEELESS_API_KEY_VALIDATION_URL}`,
      method: HttpMethod.GET,
      queryParams: {
        'api_key': apiKey
      }
    });

    if(response.status !== 200) {
      errors.push('Invalid API key');
    }

    console.log('1', response)



    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

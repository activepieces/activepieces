import { httpClient, HttpMethod } from '@activepieces/pieces-common';

type GenerateGammaParams = {
  [key: string]: unknown;
};

export class GammaClient {
  private readonly apiKey: string;
  private readonly baseUrl: string = 'https://public-api.gamma.app/v0.2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generate(params: GenerateGammaParams) {
    const { advancedOptions, ...mainParams } = params;
    const requestBody = {
      ...mainParams,
      ...((advancedOptions as object) || {}),
    };

    if (requestBody['inputText']) {
      requestBody['input_text'] = requestBody['inputText'];
      delete requestBody['inputText'];
    }
    if (requestBody['textMode']) {
      requestBody['text_mode'] = requestBody['textMode'];
      delete requestBody['textMode'];
    }
    if (requestBody['themeName']) {
      requestBody['theme_name'] = requestBody['themeName'];
      delete requestBody['themeName'];
    }
    if (requestBody['numCards']) {
      requestBody['num_cards'] = requestBody['numCards'];
      delete requestBody['numCards'];
    }
    if (requestBody['cardSplit']) {
      requestBody['card_split'] = requestBody['cardSplit'];
      delete requestBody['cardSplit'];
    }
    if (requestBody['additionalInstructions']) {
      requestBody['additional_instructions'] =
        requestBody['additionalInstructions'];
      delete requestBody['additionalInstructions'];
    }
    if (requestBody['exportAs']) {
      requestBody['export_as'] = requestBody['exportAs'];
      delete requestBody['exportAs'];
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${this.baseUrl}/generations`,
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': this.apiKey,
      },
      body: requestBody,
    });

    return response.body;
  }

  async getGeneration(generationId: string) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${this.baseUrl}/generations/${generationId}`,
      headers: {
        'X-API-KEY': this.apiKey,
      },
    });

    return response.body;
  }
  
}

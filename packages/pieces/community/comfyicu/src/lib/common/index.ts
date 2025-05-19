import { PieceAuth, PieceAuthProperty } from '@activepieces/pieces-framework';

export const COMFYICU_API_URL = 'https://api.beehiiv.com/v2';
export interface ComfyicuAuth {
  apiKey: string;
}

export interface ComfyicuContext<TProps = Record<string, any>> {
  auth: PieceAuthProperty;
  propsValue: TProps;
  webhookUrl?: string;
  payload?: {
    body: any;
  };
}

export const comfyicuAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your comfyicu API key',
  required: true,
});
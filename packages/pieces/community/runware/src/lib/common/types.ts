import type { AppConnectionType } from '@activepieces/pieces-framework';

export type RunwareAuthValue = {
  type: AppConnectionType.SECRET_TEXT;
  secret_text: string;
};

export type {
  IOutputFormat,
  IVideoOutputFormat,
} from '@runware/sdk-js';

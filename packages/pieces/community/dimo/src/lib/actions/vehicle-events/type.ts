import { HttpMethod } from "@activepieces/pieces-common";

export type VehicleEventsParams = {
  webhookId?: string;
  tokenId?: number;
};

export enum VehicleEventsBodyType {
  None = 'none',
  WebhookDefinition = 'webhookDefinition',
}

export type VehicleEventsRequiredFields = Array<'webhookId' | 'webhookDefinition' | 'tokenId'>;

export interface VehicleEventsOperation {
  label: string;
  value: string;
  method: HttpMethod;
  url: (params: VehicleEventsParams) => string;
  bodyType: VehicleEventsBodyType;
  requiredFields?: VehicleEventsRequiredFields;
}

import { BaseEntity } from '../../common/base-entity';
import { Flow } from './flow';
import { RawWebhookRequest } from './raw-webhook-request.interface';

export enum TriggerEventStatus {
    RUNNING = 'RUNNING',
    SUCCEEDED = 'SUCCEEDED',
    FAILED = 'FAILED',
}

export interface TriggerEvent extends BaseEntity {
    flowId: string;
    payload: unknown;
    status: TriggerEventStatus;
    projectId: string;
    flow?: Flow;
    rawRequest?: RawWebhookRequest | null;
}

export interface CreateTriggerEventRequest {
    flowId: string;
    payload: unknown;
    status: TriggerEventStatus;
    projectId: string;
    rawRequest?: RawWebhookRequest | null;
}
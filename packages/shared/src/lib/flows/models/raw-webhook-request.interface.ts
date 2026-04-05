export interface RawWebhookRequest {
    body: any;
    headers: Record<string, string>;
    query: Record<string, string>;
}
import { Client } from '@hcengineering/api-client';

export interface WebSocketResponse {
    status: number;
    data?: unknown;
    error?: string;
}

export class HulyClient {
    private client: Client;
    private connected = false;

    constructor(private apiKey: string) {
        this.client = new Client({
            url: 'wss://huly.io/api',
            token: apiKey
        });
    }

    async connect(): Promise<void> {
        if (this.connected) return;

        try {
            await this.client.connect();
            this.connected = true;
        } catch (error) {
            throw new Error(`Failed to connect to Huly.io: ${error.message}`);
        }
    }

    async disconnect(): Promise<void> {
        if (!this.connected) return;

        try {
            await this.client.disconnect();
            this.connected = false;
        } catch (error) {
            console.error(`Error disconnecting from Huly.io: ${error.message}`);
        }
    }

    async request(method: string, path: string, params?: unknown): Promise<WebSocketResponse> {
        await this.connect();

        try {
            const response = await this.client.request({
                method,
                path,
                params
            });

            return {
                status: response.status || 200,
                data: response.data
            };
        } catch (error) {
            return {
                status: error.status || 500,
                error: error.message
            };
        }
    }
}

export function createClient(auth: string): HulyClient {
    return new HulyClient(auth);
}

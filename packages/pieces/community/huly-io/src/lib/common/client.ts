import { connect } from '@hcengineering/api-client';

export interface WebSocketResponse {
    status: number;
    data?: unknown;
    error?: string;
}

export class HulyClient {
    private client: any = null; // Using any type to avoid Client type errors
    private connected = false;
    private workspace = 'default'; // Default workspace

    constructor(private apiKey: string) {}

    async connect(): Promise<void> {
        if (this.connected) return;

        try {
            // Use the WebSocket connect method with token authentication
            this.client = await connect('https://huly.app', {
                token: this.apiKey,
                workspace: this.workspace
            });
            this.connected = true;
        } catch (error: any) {
            throw new Error(`Failed to connect to Huly.io: ${error.message}`);
        }
    }

    async disconnect(): Promise<void> {
        if (!this.connected || !this.client) return;

        try {
            await this.client.close();
            this.connected = false;
            this.client = null;
        } catch (error: any) {
            console.error(`Error disconnecting from Huly.io: ${error.message}`);
        }
    }

    async request(method: string, path: string, params?: unknown): Promise<WebSocketResponse> {
        await this.connect();

        if (!this.client) {
            return {
                status: 500,
                error: 'Client connection failed'
            };
        }

        try {
            // For WebSocket API
            const response = await this.client.request({
                method,
                path,
                params
            });

            return {
                status: response.status || 200,
                data: response.data
            };
        } catch (error: any) {
            return {
                status: error.status || 500,
                error: error.message
            };
        }
    }

    // Helper methods for common operations
    async findOne(className: string, query: Record<string, any>): Promise<unknown> {
        await this.connect();
        if (!this.client) throw new Error('Client not connected');
        return this.client.findOne(className, query);
    }

    async findAll(className: string, query: Record<string, any>, options?: any): Promise<unknown[]> {
        await this.connect();
        if (!this.client) throw new Error('Client not connected');
        return this.client.findAll(className, query, options);
    }

    async createDoc(className: string, space: string, attributes: Record<string, any>): Promise<string> {
        await this.connect();
        if (!this.client) throw new Error('Client not connected');
        return this.client.createDoc(className, space, attributes);
    }

    async updateDoc(className: string, space: string, objectId: string, attributes: Record<string, any>): Promise<void> {
        await this.connect();
        if (!this.client) throw new Error('Client not connected');
        return this.client.updateDoc(className, space, objectId, attributes);
    }
}

export function createClient(auth: string): HulyClient {
    return new HulyClient(auth);
}

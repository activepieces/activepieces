import crypto from 'crypto';

export interface ChatbaseAuth {
    apiKey: string;
}

export interface Chatbot {
    id: string;
    name: string;
    description?: string;
}

export interface LeadSubmitPayload {
    eventType: string;
    chatbotId: string;
    payload: {
        conversationId: string;
        customerEmail: string;
        customerName: string;
        customerPhone: string;
    };
}

export const CHATBASE_API_BASE_URL = 'https://www.chatbase.co/api/v1';

export class ChatbaseError extends Error {
    constructor(message: string, public statusCode?: number) {
        super(message);
        this.name = 'ChatbaseError';
    }
}

export async function chatbaseRequest<T>(
    auth: ChatbaseAuth,
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    try {
        const response = await fetch(`${CHATBASE_API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${auth.apiKey}`,
                ...options.headers,
            },
        });

        if (!response.ok) {
            const errorMessage = await getErrorMessage(response);
            throw new ChatbaseError(errorMessage, response.status);
        }

        return response.json();
    } catch (error: unknown) {
        if (error instanceof ChatbaseError) {
            throw error;
        }
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new ChatbaseError(`Request failed: ${errorMessage}`);
    }
}

export function verifyWebhookSignature(
    signature: string,
    rawBody: Buffer,
    apiKey: string
): boolean {
    try {
        const expectedSignature = crypto
            .createHmac('sha1', apiKey)
            .update(rawBody)
            .digest('hex');
        return signature === expectedSignature;
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new ChatbaseError(`Signature verification failed: ${errorMessage}`);
    }
}

async function getErrorMessage(response: Response): Promise<string> {
    try {
        const errorData = await response.json();
        return errorData.message || getDefaultErrorMessage(response.status);
    } catch {
        return getDefaultErrorMessage(response.status);
    }
}

function getDefaultErrorMessage(status: number): string {
    switch (status) {
        case 400:
            return 'Invalid request parameters';
        case 401:
            return 'Unauthorized: Please check your API key';
        case 404:
            return 'Resource not found';
        case 500:
            return 'Internal server error occurred';
        default:
            return `Request failed with status ${status}`;
    }
} 
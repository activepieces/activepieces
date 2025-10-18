import { httpClient, HttpMethod, HttpRequest, HttpError } from '@activepieces/pieces-common';
import { CyberArkAuth } from './auth';

interface CyberArkErrorResponse {
    ErrorCode?: string;
    ErrorMessage?: string;
}

export class CyberArkClient {
    private sessionToken: string | null = null;
    private baseUrl: string;
    private auth: CyberArkAuth;

    constructor(auth: CyberArkAuth) {
        this.auth = auth;
        this.baseUrl = auth.baseUrl.replace(/\/$/, '');
    }

    async authenticate(): Promise<string> {
        if (this.sessionToken) {
            return this.sessionToken;
        }

        try {
            const response = await httpClient.sendRequest<{ CyberArkLogonResult: string }>({
                method: HttpMethod.POST,
                url: `${this.baseUrl}/PasswordVault/API/auth/${this.auth.authType}/Logon`,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: {
                    username: this.auth.username,
                    password: this.auth.password,
                },
            });

            this.sessionToken = response.body.CyberArkLogonResult;
            return this.sessionToken;
        } catch (error) {
            throw this.handleError(error, 'Authentication failed');
        }
    }

    async makeRequest<T>(
        endpoint: string,
        method: HttpMethod = HttpMethod.GET,
        body?: any
    ): Promise<T> {
        try {
            const token = await this.authenticate();

            const request: HttpRequest = {
                method,
                url: `${this.baseUrl}/PasswordVault/API${endpoint}`,
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json',
                },
            };

            if (body) {
                request.body = body;
            }

            const response = await httpClient.sendRequest<T>(request);
            return response.body;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    private handleError(error: unknown, defaultMessage?: string): Error {
        if (error instanceof HttpError) {
            const errorBody = error.response.body as CyberArkErrorResponse;
            
            if (errorBody?.ErrorCode && errorBody?.ErrorMessage) {
                return new Error(`CyberArk Error ${errorBody.ErrorCode}: ${errorBody.ErrorMessage}`);
            }

            const statusMessages: Record<number, string> = {
                400: 'Bad Request - Invalid parameters provided',
                401: 'Unauthorized - Invalid credentials or session expired',
                403: 'Forbidden - Insufficient permissions',
                404: 'Not Found - Resource does not exist',
                409: 'Conflict - Resource already exists or operation not allowed',
                500: 'Internal Server Error - CyberArk server error',
            };

            const message = statusMessages[error.response.status] || `HTTP ${error.response.status} error`;
            return new Error(defaultMessage ? `${defaultMessage}: ${message}` : message);
        }

        if (error instanceof Error) {
            return new Error(defaultMessage ? `${defaultMessage}: ${error.message}` : error.message);
        }

        return new Error(defaultMessage || 'An unknown error occurred');
    }

    async logoff(): Promise<void> {
        if (!this.sessionToken) return;

        try {
            await httpClient.sendRequest({
                method: HttpMethod.POST,
                url: `${this.baseUrl}/PasswordVault/API/auth/Logoff`,
                headers: {
                    'Authorization': this.sessionToken,
                },
            });
        } catch (error) {
            console.error('Error during logoff:', error);
        } finally {
            this.sessionToken = null;
        }
    }
}

export function createCyberArkClient(auth: CyberArkAuth): CyberArkClient {
    return new CyberArkClient(auth);
}

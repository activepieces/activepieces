import { httpClient, HttpMethod, HttpRequest } from "@activepieces/pieces-common";
import { CyberArkAuth } from "./auth";

export interface CyberArkUser {
    id: number;
    username: string;
    source: string;
    userType: string;
}

export interface CyberArkGroup {
    id: string;
    groupName: string;
}


export class CyberArkClient {
    private auth: CyberArkAuth;
    private pvwaUrl: string;

    constructor(auth: CyberArkAuth) {
        this.auth = auth;
        this.pvwaUrl = this.auth.pvwaUrl.replace(/\/$/, "");
    }

    private async logon(): Promise<string> {
        const response = await httpClient.sendRequest<string>({
            method: HttpMethod.POST,
            url: `${this.pvwaUrl}/PasswordVault/API/auth/Logon`,
            body: {
                username: this.auth.username,
                password: this.auth.password,
            },
        });
        return response.body;
    }
    
    async makeRequest<T>(
        method: HttpMethod,
        endpoint: string,
        body?: unknown,
        queryParams?: Record<string, string>
    ): Promise<T> {
        const token = await this.logon();

        const request: HttpRequest<object> = {
            method,
            url: `${this.pvwaUrl}${endpoint}`,
            body: body as object,
            queryParams: queryParams,
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": token,
            },
        };

        const { body: responseBody } = await httpClient.sendRequest<T>(request);
        return responseBody;
    }

    async getUsers(): Promise<CyberArkUser[]> {
        const response = await this.makeRequest<{ value: CyberArkUser[] }>(
            HttpMethod.GET,
            '/PasswordVault/API/Users'
        );
        return response.value;
    }

    async getUserDetails(userId: string): Promise<any> {
        return await this.makeRequest<any>(
            HttpMethod.GET,
            `/PasswordVault/API/Users/${userId}`
        );
    }
    
    /**
     * Fetches a list of all user groups from the Vault.
     */
    async getGroups(): Promise<CyberArkGroup[]> {
        const response = await this.makeRequest<{ groups: CyberArkGroup[] }>(
            HttpMethod.GET,
            '/PasswordVault/API/Groups'
        );
        return response.groups;
    }

    async getVaultAuthorizations(): Promise<{ label: string, value: string }[]> {
        return [
            { label: 'Add Safes', value: 'AddSafes' },
            { label: 'Audit Users', value: 'AuditUsers' },
            { label: 'Add/Update Users', value: 'AddUpdateUsers' },
            { label: 'Reset Users\' Passwords', value: 'ResetUsersPasswords' },
        ];
    }
}
import { OAuth2PropertyValue } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";

export function getZohoMailApiUrl(domainSuffix: string): string {
    // Ensure a default like 'com' if domainSuffix is unexpectedly empty or undefined
    return `https://mail.zoho.${domainSuffix || 'com'}/api`;
}

interface ZohoAccount {
    accountId: string;
    primaryEmailAddress: string;
    displayName?: string;
}

interface ZohoAccountsResponse {
    status: {
        code: number;
        description: string;
    };
    data: ZohoAccount[];
}

interface ZohoFolder {
    folderId: string;
    folderName: string;
}

interface ZohoFoldersResponse {
    status: { code: number; description: string; };
    data: ZohoFolder[];
}

// Modify auth type to include data_center from props, which holds the domain suffix
interface AuthWithDataCenter extends OAuth2PropertyValue {
    data_center: string; // e.g., 'com', 'eu'
}

export async function fetchAccounts(auth: AuthWithDataCenter): Promise<{ label: string; value: string; }[]> {
    const apiUrl = getZohoMailApiUrl(auth.data_center);
    const response = await httpClient.sendRequest<ZohoAccountsResponse>({
        method: HttpMethod.GET,
        url: `${apiUrl}/accounts`,
        headers: {
            'Authorization': `Zoho-oauthtoken ${auth.access_token}`,
        },
    });

    if (response.status === 200 && response.body.data) {
        return response.body.data.map(account => ({
            label: `${account.displayName || account.primaryEmailAddress} (${account.accountId})`,
            value: account.accountId,
        }));
    }
    return [];
}

export async function fetchFolders(auth: AuthWithDataCenter, accountId: string): Promise<{ label: string; value: string; }[]> {
    if (!accountId) return [];
    const apiUrl = getZohoMailApiUrl(auth.data_center);
    const response = await httpClient.sendRequest<ZohoFoldersResponse>({
        method: HttpMethod.GET,
        url: `${apiUrl}/accounts/${accountId}/folders`,
        headers: {
            'Authorization': `Zoho-oauthtoken ${auth.access_token}`,
        },
    });

    if (response.status === 200 && response.body.data) {
        return response.body.data.map(folder => ({
            label: folder.folderName,
            value: folder.folderId,
        }));
    }
    return [];
}


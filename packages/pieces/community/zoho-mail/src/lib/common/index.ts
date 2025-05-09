import { OAuth2PropertyValue } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";

export const ZOHO_MAIL_API_URL = 'https://mail.zoho.com/api';

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

export async function fetchAccounts(auth: OAuth2PropertyValue): Promise<{ label: string; value: string; }[]> {
    const response = await httpClient.sendRequest<ZohoAccountsResponse>({
        method: HttpMethod.GET,
        url: `${ZOHO_MAIL_API_URL}/accounts`,
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

export async function fetchFolders(auth: OAuth2PropertyValue, accountId: string): Promise<{ label: string; value: string; }[]> {
    if (!accountId) return []; // Don't fetch if no accountId

    const response = await httpClient.sendRequest<ZohoFoldersResponse>({
        method: HttpMethod.GET,
        url: `${ZOHO_MAIL_API_URL}/accounts/${accountId}/folders`,
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


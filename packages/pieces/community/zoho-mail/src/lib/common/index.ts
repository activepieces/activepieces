import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const zohoMailCommon = {
  baseUrl: (region: string) => `https://mail.zoho.${region}/api`,
  
  authHeaders: (accessToken: string) => {
    return {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }, 
  
  getFullUrl: (region: string, accountId: string, endpoint: string) => {
    return `${zohoMailCommon.baseUrl(region)}/accounts/${accountId}${endpoint}`;
  }
};

interface ZohoAccount {
  accountId: string;
  primaryEmailAddress: string;
  displayName?: string;
  emailAddress?: string;
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
  const typedAuth = auth as any;
  const region = typedAuth.props?.region;
  const accessToken = typedAuth.access_token;
  
  try {
    const response = await httpClient.sendRequest<ZohoAccountsResponse>({
      method: HttpMethod.GET,
      url: zohoMailCommon.baseUrl(region) + '/accounts',
      headers: zohoMailCommon.authHeaders(accessToken),
    });
    
    if (response.status === 200 && response.body.data) {
      return response.body.data.map(account => ({
        label: account.displayName || account.emailAddress || account.primaryEmailAddress,
        value: account.accountId,
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching Zoho Mail accounts:', error);
    return [];
  }
}

export async function fetchFolders(auth: OAuth2PropertyValue, accountId: string): Promise<{ label: string; value: string; }[]> {
  if (!accountId) return []; // Don't fetch if no accountId
  
  const typedAuth = auth as any;
  const region = typedAuth.props?.region;
  const accessToken = typedAuth.access_token;
  
  try {
    const response = await httpClient.sendRequest<ZohoFoldersResponse>({
      method: HttpMethod.GET,
      url: zohoMailCommon.getFullUrl(region, accountId, '/folders'),
      headers: zohoMailCommon.authHeaders(accessToken),
    });
    
    if (response.status === 200 && response.body.data) {
      return response.body.data.map(folder => ({
        label: folder.folderName,
        value: folder.folderId,
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching Zoho Mail folders:', error);
    return [];
  }
}
export * from './auth';
export * from './client';
export * from './props';

export interface BiginApiResponse<T = any> {
  data: T[];
  info?: {
    page: number;
    per_page: number;
    count: number;
    more_records: boolean;
  };
}

export interface BiginContact {
  id?: string;
  First_Name?: string;
  Last_Name?: string;
  Email?: string;
  Phone?: string;
  Mobile?: string;
  Title?: string;
  Account_Name?: {
    name: string;
    id: string;
  };
  Owner?: {
    name: string;
    id: string;
  };
  Description?: string;
  Created_Time?: string;
  Modified_Time?: string;
}

export interface BiginCompany {
  id?: string;
  Account_Name?: string;
  Phone?: string;
  Website?: string;
  Description?: string;
  Billing_Street?: string;
  Billing_City?: string;
  Billing_State?: string;
  Billing_Country?: string;
  Billing_Code?: string;
  Owner?: {
    name: string;
    id: string;
  };
  Created_Time?: string;
  Modified_Time?: string;
}

export interface BiginPipeline {
  id?: string;
  Deal_Name?: string;
  Account_Name?: {
    name: string;
    id: string;
  };
  Contact_Name?: {
    name: string;
    id: string;
  };
  Amount?: number;
  Stage?: string;
  Sub_Pipeline?: string;
  Pipeline?: {
    name: string;
    id: string;
  };
  Closing_Date?: string;
  Owner?: {
    name: string;
    id: string;
  };
  Description?: string;
  Created_Time?: string;
  Modified_Time?: string;
}

export interface BiginTask {
  id?: string;
  Subject?: string;
  Status?: string;
  Priority?: string;
  Due_Date?: string;
  Owner?: {
    name: string;
    id: string;
  };
  Description?: string;
  Created_Time?: string;
  Modified_Time?: string;
}

export interface BiginEvent {
  id?: string;
  Event_Title?: string;
  Start_DateTime?: string;
  End_DateTime?: string;
  All_day?: boolean;
  Venue?: string;
  Owner?: {
    name: string;
    id: string;
  };
  Description?: string;
  Participants?: Array<{
    Email: string;
    name: string;
    type: string;
    participant: string;
  }>;
  Created_Time?: string;
  Modified_Time?: string;
}

export interface BiginCall {
  id?: string;
  Subject?: string;
  Call_Type?: string;
  Call_Start_Time?: string;
  Call_Duration?: string;
  Call_Status?: string;
  Owner?: {
    name: string;
    id: string;
  };
  Description?: string;
  Call_Agenda?: string;
  Created_Time?: string;
  Modified_Time?: string;
}

export interface BiginProduct {
  id?: string;
  Product_Name?: string;
  Product_Code?: string;
  Unit_Price?: number;
  Product_Category?: string;
  Product_Active?: boolean;
  Owner?: {
    name: string;
    id: string;
  };
  Description?: string;
  Created_Time?: string;
  Modified_Time?: string;
}

export interface BiginUser {
  id?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  role?: {
    name: string;
    id: string;
  };
  status?: string;
  profile?: {
    name: string;
    id: string;
  };
}

import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

export async function makeRequest(
  auth: OAuth2PropertyValue,
  method: HttpMethod,
  endpoint: string,
  body?: any
): Promise<any> {
  const request: HttpRequest = {
    method,
    url: `https://www.zohoapis.com/bigin/v1${endpoint}`,
    headers: {
      Authorization: `Zoho-oauthtoken ${auth.access_token}`,
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    request.body = JSON.stringify(body);
  }

  const response = await httpClient.sendRequest(request);
  return response.body;
} 
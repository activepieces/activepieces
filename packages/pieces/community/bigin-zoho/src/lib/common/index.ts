import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';

export * from './auth';
export * from './client';
export * from './props';

export interface BiginApiResponse<T = any> {
  data: T[];
  info?: {
    count: number;
    page: number;
    per_page: number;
    more_records: boolean;
  };
}

export interface BiginContact {
  id: string;
  First_Name?: string;
  Last_Name?: string;
  Full_Name?: string;
  Email?: string;
  Mobile?: string;
  Phone?: string;
  Title?: string;
  Account_Name?: { id: string; name: string };
  Owner?: { id: string; name: string; email: string };
  Created_Time?: string;
  Modified_Time?: string;
  Created_By?: { id: string; name: string };
  Modified_By?: { id: string; name: string };
}

export interface BiginCompany {
  id: string;
  Account_Name?: string;
  Phone?: string;
  Website?: string;
  Description?: string;
  Billing_Street?: string;
  Billing_City?: string;
  Billing_State?: string;
  Billing_Country?: string;
  Billing_Code?: string;
  Owner?: { id: string; name: string; email: string };
  Created_Time?: string;
  Modified_Time?: string;
  Created_By?: { id: string; name: string };
  Modified_By?: { id: string; name: string };
}

export interface BiginPipeline {
  id: string;
  Deal_Name?: string;
  Stage?: string;
  Amount?: number;
  Closing_Date?: string;
  Account_Name?: { id: string; name: string };
  Contact_Name?: { id: string; name: string };
  Owner?: { id: string; name: string; email: string };
  Created_Time?: string;
  Modified_Time?: string;
  Created_By?: { id: string; name: string };
  Modified_By?: { id: string; name: string };
}

export interface BiginTask {
  id: string;
  Subject?: string;
  Due_Date?: string;
  Priority?: string;
  Status?: string;
  Description?: string;
  Related_To?: { id: string; name: string };
  Owner?: { id: string; name: string; email: string };
  Created_Time?: string;
  Modified_Time?: string;
  Created_By?: { id: string; name: string };
  Modified_By?: { id: string; name: string };
}

export interface BiginEvent {
  id: string;
  Event_Title?: string;
  Start_DateTime?: string;
  End_DateTime?: string;
  Venue?: string;
  Description?: string;
  Related_To?: { id: string; name: string };
  Owner?: { id: string; name: string; email: string };
  Created_Time?: string;
  Modified_Time?: string;
  Created_By?: { id: string; name: string };
  Modified_By?: { id: string; name: string };
}

export interface BiginCall {
  id: string;
  Call_Start_Time?: string;
  Call_Duration?: string;
  Call_Type?: string;
  Subject?: string;
  Description?: string;
  Contact_Name?: { id: string; name: string };
  Related_To?: { id: string; name: string };
  Owner?: { id: string; name: string; email: string };
  Created_Time?: string;
  Modified_Time?: string;
  Created_By?: { id: string; name: string };
  Modified_By?: { id: string; name: string };
}

export interface BiginProduct {
  id: string;
  Product_Name?: string;
  Product_Code?: string;
  Unit_Price?: number;
  Product_Category?: string;
  Description?: string;
  Owner?: { id: string; name: string; email: string };
  Created_Time?: string;
  Modified_Time?: string;
  Created_By?: { id: string; name: string };
  Modified_By?: { id: string; name: string };
}

export interface BiginUser {
  id: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  status?: string;
  Created_Time?: string;
  Modified_Time?: string;
}

export async function makeRequest(
  access_token: string,
  method: HttpMethod,
  path: string,
  location?: string,
  body?: unknown
): Promise<any> {
  const { makeRequest: makeRequestFunction } = await import('./client');
  return makeRequestFunction(access_token, method, path, location, body);
} 
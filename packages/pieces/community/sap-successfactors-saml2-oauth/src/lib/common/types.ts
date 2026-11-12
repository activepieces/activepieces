export interface SuccessFactorsAuthProps {
  base_url: string;
  api_url: string;
  client_id: string;
  user_id: string;
  company_id: string;
  private_key: string;
}

export interface SuccessFactorsTokenResponse {
  access_token: string;
  expires_in: number | string;
  token_type?: string;
}

export interface SuccessFactorsODataSingleResponse<T> {
  d: T;
}

export interface SuccessFactorsUser {
  userId?: string | null;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  status?: string | null;
  personIdExternal?: string | null;
  department?: string | null;
  division?: string | null;
  title?: string | null;
}

export interface AuthenticationParams {
  apiKey: string;
}

export interface CheckResultParams {
  request_id?: string;
}

export interface ParseResumeParams
  extends AuthenticationParams,
    CheckResultParams {
  url?: string;
}

export interface ReviewResumeParams
  extends AuthenticationParams,
    CheckResultParams {
  url?: string;
}

export interface GetProfileDataParams
  extends AuthenticationParams,
    CheckResultParams {
  profile_name?: string;
}

export interface GetCompanyDataParams
  extends AuthenticationParams,
    CheckResultParams {
  company_name?: string;
  company_username?: string;
  company_website?: string;
}

export interface ScoreResumeParams
  extends AuthenticationParams,
    CheckResultParams {
  url?: string;
  job_description?: string;
}

import { ApFile } from "@activepieces/pieces-framework";

export interface AuthenticationParams {
  apiKey: string;
}

// Request types

export interface UploadFileParams extends AuthenticationParams {
  file: ApFile;
}

export interface AnalyzeAudioParams extends AuthenticationParams {
  file_id: string;
}

export interface AnalyzeImageParams extends AuthenticationParams {
  images: string[];
  domain: string;
}

export interface AnalyzeDocumentParams extends AuthenticationParams {
  file_id: string;
  domain: string;
}

export interface AnalyzeVideoParams extends AuthenticationParams {
  file_id: string;
  domain: string;
}

export interface GetFileParams extends AuthenticationParams {
  file_id: string;
}

// Response types
export interface FileResponse {
  id: string;
  filename: string;
  bytes: number;
  purpose: string;
  created_at: string;
  object: 'file';
}
type JobStatus = string;
interface CreditUsage {
  elements_processed?: number;
  element_type?: 'image' | 'page' | 'video' | 'audio';
  credits_used?: number;
}
export interface PredictionResponse {
  id: string;
  created_at: string;
  completed_at?: string;
  response?: any;
  status: JobStatus;
  message?: string;
  usage?: CreditUsage;
}

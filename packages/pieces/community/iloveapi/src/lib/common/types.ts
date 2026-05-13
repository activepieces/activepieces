export type ILoveApiTool =
  | 'compress'
  | 'merge'
  | 'split'
  | 'pdfjpg'
  | 'imagepdf'
  | 'officepdf'
  | 'htmlpdf'
  | 'pdfocr'
  | 'watermark'
  | 'protect'
  | 'unlock'
  | 'pagenumber'
  | 'rotate'
  | 'extract'
  | 'repair'
  | 'sign';

export type SignatureSigner = {
  name: string;
  email: string;
  phone?: string;
  type?: 'signer' | 'validator' | 'viewer';
  force_signature_type?: 'all' | 'text' | 'sign' | 'image';
  files?: Array<{ server_filename: string; elements?: SignatureElement[] }>;
  access_code?: string;
  notes?: string;
};

export type SignatureElement = {
  type: 'signature' | 'initials' | 'date' | 'text' | 'input';
  position: string;
  pages: string;
  size?: number;
  content?: string;
  color?: string;
  font?: string;
};

export type CreateSignatureRequest = {
  task: string;
  files: Array<{
    server_filename: string;
    filename: string;
  }>;
  signers: SignatureSigner[];
  brand_name?: string;
  brand_logo?: string;
  language?: string;
  subject_signer?: string;
  message_signer?: string;
  subject_completed?: string;
  message_completed?: string;
  lock_order?: boolean;
  expiration_days?: number;
  signer_reminders?: boolean;
  signer_reminder_days_cycle?: number;
  uuid_visible?: boolean;
  verify_enabled?: boolean;
  certified?: boolean;
  mode?: 'single' | 'multiple' | 'batch';
};

export type CreateSignatureResponse = {
  uuid: string;
  token_requester: string;
  status: string;
  created?: string;
  expires?: string;
  certified?: boolean;
  signers?: Array<{
    uuid: string;
    name: string;
    email: string;
    type: string;
    status: string;
    token_requester?: string;
  }>;
  files?: Array<{ filename: string; pages?: number }>;
} & Record<string, unknown>;

export type StartTaskResponse = {
  server: string;
  task: string;
  remaining_files?: number;
};

export type AuthResponse = {
  token: string;
};

export type UploadResponse = {
  server_filename: string;
};

export type ProcessFile = {
  server_filename: string;
  filename: string;
  rotate?: 0 | 90 | 180 | 270;
  password?: string;
};

export type ProcessRequest = {
  task: string;
  tool: ILoveApiTool;
  files: ProcessFile[];
  output_filename?: string;
  packaged_filename?: string;
  ignore_errors?: boolean;
  ignore_password?: boolean;
  try_pdf_repair?: boolean;
} & Record<string, unknown>;

export type ProcessResponse = {
  download_filename: string;
  filesize?: number;
  output_filesize?: number;
  output_filenumber?: number;
  output_extensions?: string[];
  status?: string;
  task?: string;
  timer?: string;
} & Record<string, unknown>;

export interface PaperformForm {
  id: string;
  slug: string;
  custom_slug?: string;
  space_id: string;
  title: string;
  description?: string;
  cover_image_url?: string;
  url: string;
  additional_urls?: string[];
  live: boolean;
  tags?: string[];
  submission_count: number;
  created_at: string;
  updated_at: string;
  account_timezone: string;
  created_at_utc: string;
  updated_at_utc: string;
}

export interface PaperformFormsResponse {
  status: string;
  results: {
    forms: PaperformForm[];
  };
  total: number;
  has_more: boolean;
  limit: number;
  skip: number;
}

export interface PaperformWebhookResponse {
  id: string;
} 
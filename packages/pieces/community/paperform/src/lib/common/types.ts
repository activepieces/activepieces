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

export interface PaperformSubmission {
  id: string;
  form_id: string;
  created_at: string;
  updated_at: string;
  data: Record<string, any>;
}

export interface PaperformPartialSubmission {
  id: string;
  form_id: string;
  data: Record<string, any>;
  last_answered: string;
  submitted_at: string;
  updated_at: string;
  created_at: string;
  account_timezone: string;
  submitted_at_utc: string;
  created_at_utc: string;
  updated_at_utc: string;
}

export interface PaperformCoupon {
  code: string;
  enabled: boolean;
  target?: string;
  discountAmount?: number;
  discountPercentage?: number;
  expiresAt?: string | null;
}

export interface PaperformProductImage {
  url: string;
  width: number;
  height?: number;
}

export interface PaperformProduct {
  name: string;
  quantity?: number;
  price: number;
  minimum?: number;
  maximum?: number;
  discountable?: boolean;
  images?: PaperformProductImage[];
  SKU: string;
}

export interface PaperformField {
  key: string;
  title: string;
  description?: string;
  required: boolean;
  type: string;
  custom_key?: string;
  placeholder?: string;
  options?: string[];
}

export interface PaperformSpace {
  id: string;
  name: string;
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

export interface PaperformSubmissionsResponse {
  status: string;
  results: {
    submissions: PaperformSubmission[];
  };
  total: number;
  has_more: boolean;
  limit: number;
  skip: number;
}

export interface PaperformPartialSubmissionsResponse {
  status: string;
  results: {
    "partial-submissions": PaperformPartialSubmission[];
  };
  total: number;
  has_more: boolean;
  limit: number;
  skip: number;
}

export interface PaperformCouponsResponse {
  status: string;
  results: {
    coupons: PaperformCoupon[];
  };
  total: number;
  has_more: boolean;
  limit: number;
  skip: number;
}

export interface PaperformProductsResponse {
  status: string;
  results: {
    products: PaperformProduct[];
  };
  total: number;
  has_more: boolean;
  limit: number;
  skip: number;
}

export interface PaperformSpacesResponse {
  status: string;
  results: {
    spaces: PaperformSpace[];
  };
  total: number;
  has_more: boolean;
  limit: number;
  skip: number;
}

export interface PaperformFieldsResponse {
  status: string;
  results: {
    fields: PaperformField[];
  };
}

export interface PaperformProductResponse {
  status: string;
  results: {
    product: PaperformProduct;
  };
}

export interface PaperformCouponResponse {
  status: string;
  results: {
    coupon: PaperformCoupon;
  };
}

export interface PaperformWebhook {
  id: string;
  target_url: string;
  triggers: string[];
  created_at: string;
  updated_at: string;
  account_timezone: string;
  created_at_utc: string;
  updated_at_utc: string;
}

export interface PaperformWebhookResponse {
  status: string;
  results: {
    webhook: PaperformWebhook;
  };
}

export interface PaperformCreateSpaceResponse{
  results:{
    space:{
      id:number,
      name:string
    }
  }
}

export interface PaperformUpdateSpaceResponse{
  results:{
    space:{
      id:number,
      name:string
    }
  }
}

export interface PaperformCreateProductResponse{
  results:{
    product:{
      name:string
    }
  }
}

export interface PaperformCreateCouponResponse{
  results:{
    coupon:{
      code:string
    }
  }
}


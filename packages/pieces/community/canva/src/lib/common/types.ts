// Type definitions for Canva Connect API responses

export interface CanvaDesign {
  id: string;
  title: string;
  design_type?: {
    type: string;
    name?: string;
  };
  thumbnail?: {
    url: string;
  };
  urls?: {
    edit_url: string;
    view_url: string;
  };
  created_at?: number;
  updated_at?: number;
}

export interface CanvaAsset {
  id: string;
  name: string;
  tags?: string[];
  thumbnail?: {
    url: string;
  };
  created_at?: number;
  updated_at?: number;
}

export interface CanvaFolder {
  id: string;
  name: string;
  created_at: number;
  updated_at: number;
}

export interface CanvaExportJob {
  job: {
    id: string;
    status: 'in_progress' | 'success' | 'failed';
    error?: {
      message: string;
    };
    urls?: string[];
  };
}

export interface CanvaImportJob {
  job: {
    id: string;
    status: 'in_progress' | 'success' | 'failed';
    error?: {
      message: string;
    };
  };
  design?: CanvaDesign;
}

export interface ListDesignsResponse {
  items: CanvaDesign[];
  continuation?: string;
}

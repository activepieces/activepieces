// Type definitions for Canva API responses

export interface CanvaDesign {
  id: string;
  title: string;
  owner?: {
    user_id: string;
    team_id?: string;
  };
  thumbnail?: {
    url: string;
    width: number;
    height: number;
  };
  urls?: {
    edit_url: string;
    view_url: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface CanvaFolder {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

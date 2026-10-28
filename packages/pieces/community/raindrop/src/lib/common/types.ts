export type RaindropAuthValue = { access_token: string };

export type RaindropCollection = {
  _id: number;
  title: string;
};

export type RaindropItem = {
  _id: number;
  title?: string;
  excerpt?: string;
  note?: string;
  link?: string;
  type?: string;
  tags?: string[];
  important?: boolean;
  collection?: { $id: number };
  cover?: string;
  created?: string;
  lastUpdate?: string;
};

export type RaindropFlatItem = {
  id: number;
  title: string | null;
  excerpt: string | null;
  note: string | null;
  link: string | null;
  type: string | null;
  tags: string | null;
  important: boolean;
  collection_id: number | null;
  cover: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type RaindropUser = { user?: { email?: string; fullName?: string } };

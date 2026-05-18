type User = {
  handle: string;
  img_url: string;
  id: string;
};

type Pos = {
  x: number;
  y: number;
};

export type Comment = {
  id: string;
  uuid: string;
  file_key: string;
  parent_id: string;
  user: User;
  created_at: string;
  resolved_at: string;
  message: string;
  reactions: unknown;
  client_meta: Pos;
  order_id: number;
};

export type BoxAuthValue = { access_token: string };

export type BoxWebhook = {
  id: string;
  target: string;
  type: string;
  address: string;
  created_at: string;
  created_by: string;
  triggers: string[];
};

export type BoxWebhookTarget = { id: number | string; type: string };

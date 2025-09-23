export type Server = 'staging' | 'production';

export type PromptXAuth = {
  server?: Server;
  username: string;
  password: string;
  customAuthUrl?: string;
  customAppUrl?: string;
};

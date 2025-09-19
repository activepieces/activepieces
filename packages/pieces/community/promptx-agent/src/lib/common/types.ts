export type Server = 'staging' | 'production';

export type PromptXAuthType = {
  server?: Server;
  customAuthUrl?: string;
  customAppUrl?: string;
  username: string;
  password: string;
  accessToken?: string;
  agentXToken?: string;
};

export type PromptXLoginResponseType = {
  access_token: string;
  error?: string;
  message?: string;
};

export type AgentXLoginResponseType = {
  token: string;
};

export type PromptXUserResponseType = {
  id: string;
  email: string;
  username: string;
  firstname: string;
  lastname: string;
  userIAM2ID: number;
};

export type Agent = {
  createdAt: string;
  updatedAt: string;
  id: string;
  name: string;
  persona: string;
  role: string;
  creatorId: string;
};

export type Conversation = {
  createdAt: string;
  updatedAt: string;
  id: string;
  title: string;
  creatorId: string;
  agentId: string;
};

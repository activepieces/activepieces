import { StaticPropsValue } from '@activepieces/pieces-framework';
import { teamworkAuth } from './auth';

export interface ApFile {
  filename: string;
  extension?: string;
  base64: string;
  data: Buffer;
}

export interface Company {
  id: number;
  name: string;
  website: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  description: string;
  tags: number[];
}

export interface CreateCompanyResponse {
  company: Company;
}

export interface TeamworkFile {
  id: number;
  name: string;
  filetype: string;
  size: number;
}

export interface UploadFileResponse {
  file: TeamworkFile;
}

export interface MessageReply {
  id: number;
  content: string;
}

export interface CreateMessageReplyResponse {
  messageReply: MessageReply;
}

export interface Milestone {
  id: number;
  content: string;
  ['due-date']: string; 
}

export interface CreateMilestoneResponse {
  milestone: Milestone;
}

export interface NotebookComment {
  id: number;
  content: string;
}

export interface CreateNotebookCommentResponse {
  notebookComment: NotebookComment;
}

export interface Person {
  id: number;
  ['first-name']: string;
  ['last-name']: string;
  ['email-address']: string;
  ['company-id']?: string;
  ['user-type']?: string;
  title?: string;
  ['is-client-user']?: boolean;
  ['send-invite']?: boolean;
}

export interface CreatePersonResponse {
  person: Person;
}

export type TeamworkAuth = StaticPropsValue<{
  auth: typeof teamworkAuth;
}>;


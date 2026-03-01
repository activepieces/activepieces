import { HttpMessageBody } from '@activepieces/pieces-common';
export interface VboutResponseBody<T> extends HttpMessageBody {
  response: {
    header: {
      status: string;
      dataType: string;
      limit: string;
      cached?: string;
    };
    data: T;
  };
}
export interface EmailListCreateRequest {
  name: string;
  email_subject?: string;
  reply_to?: string;
  fromemail?: string;
  from_name?: string;
  doubleOption?: string;
  notify?: string;
  notify_email?: string;
  success_email?: string;
  success_message?: string;
  error_message?: string;
  confirmation_email?: string;
  confirmation_message?: string;
  communications?: boolean;
}
export interface ContactList {
  id: string;
  name: string;
  form_title: string;
  email_subject: string;
  reply_to: string;
  from_email: string;
  from_name: string;
  confirmation_email: string;
  success_email: string;
  confirmation_message: string;
  success_message: string;
  error_message: string;
  doubleOption: string;
  notify_email: string;
  creation_date: string;
  fields: {
    [key: string]: string;
  };
}

export interface ContactCreateRequest {
  listid?: string;
  status?: string;
  email: string;
  ipaddress?: string;
  fields?: {
    [key: string]: string;
  };
}

export interface ContactUpdateRequest {
  id: string;
  listid?: string;
  status?: string;
  email?: string;
  ipaddress?: string;
  fields?: {
    [key: string]: string;
  };
}

export interface TagCreateRequest {
  email: string;
  tagname: string[];
}

export interface CampaignCreateRequest {
  name: string;
  subject: string;
  fromemail: string;
  from_name: string;
  reply_to: string;
  body: string;
  type: string;
  lists: string;
}
export interface SocialMediaProfile {
  id: string;
  name: string;
}
export interface SocialMediaChannelListResponse {
  Facebook: {
    count: number;
    pages: SocialMediaProfile[];
  };
  Twitter: {
    count: number;
    profiles: SocialMediaProfile[];
  };
  Linkedin: {
    count: number;
    profiles: SocialMediaProfile[];
    companies: SocialMediaProfile[];
  };
}

export interface SocialMediaPostCreateRequest {
  message: string;
  channel: string;
  channelid: string;
}

export enum SocialMediaChannelValues {
  TWITTER = 'twitter',
  LINKEDIN = 'linkedin',
  FACEBOOK = 'facebook',
}
export enum ContactStatusValues {
  UNCONFIRMED = '0',
  ACTIVE = '1',
  UNSUBSCRIBE = '2',
  BOUNCED_EMAIL = '3',
}

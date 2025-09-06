export interface AuthorizationParams {
  accessToken: string;
}

export interface BaseCampaignKeyParams {
  campaignkey: string;
}

export interface CreateCampaignParams extends AuthorizationParams {
  campaignname: string;
  from_email: string;
  subject: string;
  content_url?: string;
  list_details: object;
  topicId?: string;
}

export interface CloneCampaignParams extends AuthorizationParams {
  campaigninfo: object;
}

export interface SendCampaignParams
  extends AuthorizationParams,
    BaseCampaignKeyParams {}

export interface AddUpdateContactParams extends AuthorizationParams {
  listkey: string;
  contactinfo: object;
  source?: string;
  topic_id?: string;
}

export interface AddTagToContactParams extends AuthorizationParams {
  tagName: string;
  lead_email: string;
}

export interface RemoveTagParams extends AuthorizationParams {
  tagName: string;
  lead_email: string;
}

export interface UnsubscribeContactParams extends AuthorizationParams {
  listkey: string;
  contactinfo: object;
  topic_id?: string;
}

export interface AddContactToMailingListParams extends AuthorizationParams {
  listkey: string;
  emailids: string;
}

export interface ListContactsParams extends AuthorizationParams {
  listkey: string;
  sort?: 'asc' | 'desc';
  fromindex?: number;
  range?: number;
  status?: 'active' | 'recent' | 'most recent' | 'unsub' | 'bounce';
}

export interface ListCampaignParams extends AuthorizationParams {
  sort?: 'asc' | 'desc';
  fromindex?: number;
  range?: number;
}

export interface GetCampaignParams
  extends AuthorizationParams,
    BaseCampaignKeyParams {}

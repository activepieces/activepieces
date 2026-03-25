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

export interface CreateTagParams extends AuthorizationParams {
  tagName: string;
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
  status?:
    | 'all'
    | 'all campaigns'
    | 'drafts'
    | 'scheduled'
    | 'inprogress'
    | 'sent'
    | 'stopped'
    | 'canceled'
    | 'tobereviewed'
    | 'reviewed'
    | 'paused'
    | 'intesting';
}

export interface ListMailingListsParams extends AuthorizationParams {
  sort?: 'asc' | 'desc';
  fromindex?: number;
  range?: number;
}


// API Response types
export type Campaign = {
  campaign_key: string;
  campaign_name: string;
  created_date_string: string;
  campaign_status: string;
  created_time: string;
  campaign_preview: string;
};

export type Contact = {
  firstname: string;
  added_time: string;
  phone: string;
  companyname: string;
  contact_email: string;
  lastname: string;
  zuid: string;
};

export type MailingList = {
  date: string;
  deletable: string;
  segments: object;
  updated_time_gmt: string;
  listdesc: string;
  created_time_gmt: string;
  list_created_time: string;
  noofunsubcnt: string;
  lockstatus: string;
  listkey: string;
  listtype: string;
  sentcnt: string;
  owner: string;
  list_campaigns_count: string;
  created_time: string;
  noofcontacts: string;
  editable: string;
  listname: string;
  listdgs: string;
  noofbouncecnt: string;
  issmart: string;
  list_created_date: string;
  listnotifications: string;
  listunino: string;
  zuid: string;
  servicetype: string;
  sno: string;
  is_public: string;
  otherslist: string;
  zx: string;
};

export type Topic = {
  topicId: string;
  topicName: string;
  primaryList: number;
};

export type Tag = {
  [key: string]: {
    tagowner: string;
    tag_created_time: string;
    tag_name: string;
    tag_color: string;
    tag_desc: string;
    tagged_contact_count: string;
    is_crm_tag: string;
    zuid: string;
  };
};

export interface ListCampaignResponse {
  fromindex: string;
  total_record_count: string;
  code: string;
  recent_campaigns: Campaign[];
  range: string;
  campaign_count: string;
  uri: string;
  version: string;
  requestdetails: string;
  status: string;
}

export interface ListContactsResponse {
  code: string;
  uri: string;
  version: string;
  list_of_details: Contact[];
  requestdetails: {
    fromindex: number;
    range: number;
    sort: string;
    status: string;
  };
  status: string;
}

export interface ListMailingListsResponse {
  code: string;
  uri: string;
  version: string;
  list_of_details: MailingList[];
  requestdetails: {
    fromindex: number;
    range: number;
    total_list_count: number;
    sort: string;
  };
  status: string;
}

export interface ListTopicsResponse {
  topicDetails: Topic[];
  message: string;
  code: string;
  uri: string;
}

export interface CreateCampaignResponse {
  message: string;
  campaignKey: string;
  code: string;
  uri: string;
}

export interface ListTagsResponse {
  uri: string;
  version: string;
  requestdetails: string;
  tags?: Tag[];
}

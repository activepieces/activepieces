import type { AppConnectionType } from '@activepieces/pieces-framework';

export type ZohoCampaignsAuthValue = {
  type:
    | AppConnectionType.OAUTH2
    | AppConnectionType.CLOUD_OAUTH2
    | AppConnectionType.PLATFORM_OAUTH2;
  access_token: string;
  props?: { location?: string };
};

export type ZohoCampaignsSort = 'asc' | 'desc';

export type ZohoCampaignsSignupForm = 'public' | 'private';

export type ZohoCampaignsContactStatus =
  | 'active'
  | 'recent'
  | 'most recent'
  | 'unsub'
  | 'bounce';

export type ZohoCampaignsCampaignStatus =
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

export type ZohoCampaignsRecipientAction =
  | 'sentcontacts'
  | 'openedcontacts'
  | 'optoutcontacts'
  | 'spamcontacts'
  | 'unopenedcontacts'
  | 'clickedcontacts'
  | 'senthardbounce'
  | 'sentsoftbounce'
  | 'unsentcontacts';

export type ZohoCampaignsResponse = {
  status?: string;
  code?: string | number;
  message?: string;
  response?: {
    status?: string;
    code?: string | number;
    message?: string;
  };
};

export type ZohoCampaignsCampaign = {
  campaign_key: string;
  campaign_name: string;
  created_date_string: string;
  campaign_status: string;
  created_time: string;
  campaign_preview: string;
};

export type ZohoCampaignsContact = {
  firstname: string;
  added_time: string;
  phone: string;
  companyname: string;
  contact_email: string;
  lastname: string;
  zuid: string;
};

export type ZohoCampaignsMailingList = {
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

export type ZohoCampaignsTopic = {
  topicId: string;
  topicName: string;
  primaryList: number;
};

export type ZohoCampaignsTag = {
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

export type ZohoCampaignsListCampaignsResponse = ZohoCampaignsResponse & {
  fromindex?: string;
  total_record_count?: string;
  recent_campaigns?: ZohoCampaignsCampaign[];
  range?: string;
  campaign_count?: string;
  uri?: string;
  version?: string;
  requestdetails?: string;
};

export type ZohoCampaignsListContactsResponse = ZohoCampaignsResponse & {
  code: string;
  uri: string;
  version: string;
  list_of_details?: ZohoCampaignsContact[];
  requestdetails: {
    fromindex: number;
    range: number;
    sort: string;
    status: string;
  };
  status: string;
};

export type ZohoCampaignsListMailingListsResponse = ZohoCampaignsResponse & {
  code: string;
  uri: string;
  version: string;
  list_of_details?: ZohoCampaignsMailingList[];
  requestdetails: {
    fromindex: number;
    range: number;
    total_list_count: number;
    sort: string;
  };
  status: string;
};

export type ZohoCampaignsListTopicsResponse = ZohoCampaignsResponse & {
  topicDetails: ZohoCampaignsTopic[];
  message: string;
  code: string;
  uri: string;
};

export type ZohoCampaignsCreateCampaignResponse = ZohoCampaignsResponse & {
  campaignKey?: string;
  uri?: string;
};

export type ZohoCampaignsListTagsResponse = ZohoCampaignsResponse & {
  uri: string;
  version: string;
  requestdetails: string;
  tags?: ZohoCampaignsTag[];
};

export type ZohoCampaignsListSentCampaignsResponse = ZohoCampaignsResponse & {
  recent_sent_campaigns?: string;
};

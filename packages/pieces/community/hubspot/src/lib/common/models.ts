export type Contact = {
  email: string;
  firstname: string;
  lastname: string;
  website: string;
  company: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
};

export type RequestProperty = {
  property: string;
  value: string;
};

export type HubSpotRequest = {
  properties: RequestProperty[];
};

export type HubSpotContactsCreateOrUpdateResponse = {
  vid: string;
  isNew: boolean;
};

export type HubSpotList = {
  listId: number;
  name: string;
};

export type HubSpotListsResponse = {
  lists: HubSpotList[];
};

export type HubSpotAddContactsToListResponse = {
  updated: number[];
  discarded: number[];
  invalidVids: number[];
  invalidEmails: string[];
};

export type HubSpotAddContactsToListRequest = {
  emails: string[];
};

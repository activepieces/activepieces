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
}

export type HubSpotContactsCreateOrUpdateResponse = {
  vid: string;
  isNew: boolean;
};

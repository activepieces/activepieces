export type ZohoBooksAuthValue = {
  access_token: string;
  props?: { location?: string };
  data?: { api_domain?: string };
};

export type ZohoBooksOrganization = {
  organization_id: string;
  name?: string;
  is_default_org?: boolean;
};

export type ZohoBooksOrganizationsResponse = {
  code?: number;
  message?: string;
  organizations?: ZohoBooksOrganization[];
};

export type ZohoBooksContactResponse = {
  code?: number;
  message?: string;
  contact?: { contact_id?: string; tags?: { tag_id: string; tag_option_id?: string }[] };
};

export type ZohoBooksQuery = Record<string, string | number | boolean | undefined>;

export type ZohoBooksDownload = {
  data: Buffer;
  contentType?: string;
  fileName?: string;
};

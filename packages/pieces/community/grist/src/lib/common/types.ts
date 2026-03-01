export type GristAPIClientOptions = {
  domainUrl: string;
  apiKey: string;
};

export type GristOrganizationResponse = {
  name: string;
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type GristDocumentResponse = {
  name: string;
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type GristWorkspaceResponse = {
  name: string;
  id: number;
  createdAt: string;
  updatedAt: string;
  docs: Array<GristDocumentResponse>;
};

export type GristTableResponse = {
  id: string;
};

export type GristTableColumnsResponse = {
  id: string;
  fields: {
    type:
      | 'Any'
      | 'Text'
      | 'Numeric'
      | 'Int'
      | 'Bool'
      | 'Date'
      | `DateTime:${string}`
      | `Ref:${string}`
      | `RefList:${string}`
      | 'Choice'
      | 'ChoiceList'
      | 'Attachments';
    label: string;
    widgetOptions: string;
    isFormula: boolean;
  };
};

export type GristTableRecordResponse = {
  id: number;
  fields: Record<string, any>;
};

export type GristCreateRecordsRequest = {
  records: Array<Omit<GristTableRecordResponse, 'id'>>;
};

export type GristUpdateRecordsRequest = {
  records: Array<GristTableRecordResponse>;
};

export type GristCreateRecordsResponse = {
  records: Array<{ id: number }>;
};

export type GristListRecordsResponse = {
  records: Array<GristTableRecordResponse>;
};

export type GristCreateWebhookRequest = {
  webhooks: Array<{
    fields: {
      name?: string;
      memo?: string;
      url: string;
      enabled: boolean;
      eventTypes: Array<string>;
      isReadyColumn?: string;
      tableId: string;
    };
  }>;
};

export type GristCreateWebhookResponse = {
  webhooks: Array<{ id: number }>;
};

export type GristWebhookPayload = Record<string, any>;

export type GristOrgResponse = {
  id: number
  name: string
  domain: string
  owner: {
    id: number
    name: string
    picture: any
  }
  access: string
  createdAt: string
  updatedAt: string
}


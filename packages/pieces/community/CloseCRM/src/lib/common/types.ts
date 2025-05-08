export interface CloseCRMLead {
    name: string;
    status_id?: string;
    contacts?: {
      name: string;
      emails?: { email: string }[];
      phones?: { phone: string }[];
    }[];
    [key: string]: unknown; // For custom fields
  }
  
  export interface CloseCRMClient {
    post(endpoint: string, data: unknown): Promise<{ data: unknown }>;
    // Add other methods as needed
  }

  export interface CloseCRMDeal {
    status?: 'active' | 'won' | 'lost' | 'archived';
    value?: number;
    note?: string;
    [key: string]: unknown; // For custom fields
  }

  export interface CloseCRMEmailActivity {
    lead_id: string;
    direction: 'outgoing' | 'incoming';
    note: string;
    date_created: string;
    _type: 'email';
    email: {
      subject: string;
      body: string;
      sender?: string;
      to: Array<{
        email: string;
        name?: string;
      }>;
      attachments?: Array<{
        name: string;
        url: string;
        size?: number;
      }>;
    };
  }

  export interface CloseCRMWebhookLead {
    id: string;
    name: string;
    status_id: string;
    contacts: {
      name: string;
      emails: { email: string }[];
      phones: { phone: string }[];
    }[];
    date_created: string;
    [key: string]: unknown; // For custom fields
  }

  export interface CloseCRMContact {
    lead_id: string;
    name: string;
    title?: string;
    emails?: {
      email: string;
      type?: 'work' | 'home' | 'other';
    }[];
    phones?: {
      phone: string;
      type?: 'mobile' | 'work' | 'home' | 'fax' | 'other';
    }[];
    urls?: {
      url: string;
      type?: 'website' | 'linkedin' | 'twitter' | 'other';
    }[];
    [key: string]: unknown; // For custom fields
  }

  //contact search query
  export interface CloseCRMSearchQuery {
    query: {
      type: string;
      queries: any[];
    };
    _fields: {
      contact: string[];
    };
  }
  
  export interface CloseCRMContact {
    id: string;
    name: string;
    title?: string;
    lead_id: string;
    date_created?: string;
    date_updated?: string;
    email: {
      email: string;
      type?: string;
    }[];
    phone: {
      phone: string;
      type?: string;
    }[];
    url: {
      url: string;
      type?: string;
    }[];
  }

  //Find lead 
  export interface CloseCRMLead {
    id: string;
    name: string;
    display_name?: string;
    status_label?: string;
    url?: string;
    date_created?: string;
    date_updated?: string;
    contact: {
      id: string;
      name: string;
    }[];
    custom_fields?: Record<string, unknown>;
  }
  
  export interface CloseCRMSearchQuery {
    query: {
      type: string;
      queries: any[];
    };
    _field: {
      lead: string[];
    };
  }
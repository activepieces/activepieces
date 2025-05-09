export interface CloseCRMLead {
    id: string;
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
    status: 'active' | 'won' | 'lost' | 'archived';
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

  export interface CloseCRMLeadWebhookPayload {
    id: string;
    action: 'created' | 'updated' | 'deleted';
    object_type: 'lead';
    object_id: string;
    date_created: string;
    data: {
      id: string;
      name: string;
      status_label?: string;
      status_id?: string;
      contacts?: Array<string | ContactDetails>;
      date_created: string;
      date_updated: string;
      [key: string]: unknown; // For custom fields
    };
    organization_id: string;
  }
  
  interface ContactDetails {
    id: string;
    name: string;
    emails?: Array<{ email: string; type?: string }>;
    phones?: Array<{ phone: string; type?: string }>;
    [key: string]: unknown;
  }

  export interface CloseCRMContact {
    lead_id: string;
    id: string;
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
      lead: string[];
    };
  }
  
  export interface CloseCRMContact {
    id: string;
    name: string;
    title?: string;
    lead_id: string;
    date_created?: string;
    date_updated?: string;
    email?: {
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

  
  export interface CloseCRMSearchQuery {
    query: {
      type: string;
      queries: any[];
    };
  }

  //NEW-CONTACT-ADDED

  export interface CloseCRMContactWebhookPayload {
    id: string;
    action: 'created' | 'updated' | 'deleted';
    object_type: 'contact';
    object_id: string;
    lead_id: string;
    date_created: string;
    data: {
      id: string;
      name: string;
      title?: string;
      lead_id: string;
      emails?: Array<{ email: string; type?: string }>;
      phones?: Array<{ phone: string; type?: string }>;
      date_created: string;
      date_updated: string;
    };
    organization_id: string;
  }
  

  //create opportunity
  export interface CloseCRMOpportunity {
    lead_id: string;
    name?: string;
    note?: string;
    status_id?: string;
    confidence?: number;
    value?: number;
    value_currency?: string;
    value_period?: 'one_time' | 'monthly' | 'annual';
    status?: 'active' | 'won' | 'lost' | 'archived';
    contact_id?: string;
    user_id?: string;
    date_won?: string;
    [key: string]: unknown; // For custom fields
  }

  //find opportunity

  export interface CloseCRMOpportunity {
    lead_id: string;
    lead_name?: string;
    status_id?: string;
    status_label?: string;
    status_type?: 'active' | 'won' | 'lost' | 'archived';
    pipeline_id?: string;
    pipeline_name?: string;
    user_id?: string;
    user_name?: string;
    contact_id?: string;
    value?: number;
    value_period?: 'one_time' | 'monthly' | 'annual';
    value_formatted?: string;
    expected_value?: number;
    annualized_value?: number;
    annualized_expected_value?: number;
    confidence?: number;
    note?: string;
    date_created?: string;
    date_updated?: string;
    date_won?: string;
  }

  //opportunity-status changed
  export interface CloseCRMOpportunityWebhookPayload {
    id: string;
    action: 'created' | 'updated' | 'deleted';
    object_type: 'opportunity';
    object_id: string;
    lead_id: string;
    payload_id: string;
    date_created: string;
    changed_fields: string[];
    previous_data?: {
      status_type?: string;
      status_label?: string;
      status_id?: string;
      value?: number;
      confidence?: number;
    };
    data: {
      id: string;
      lead_id: string;
      status_type: 'active' | 'won' | 'lost' | 'archived';
      status_label: string;
      status_id: string;
      value?: number;
      value_currency?: string;
      value_formatted?: string;
      contact_id?: string;
      contact_name?: string;
      lead_name?: string;
      date_won?: string;
      date_lost?: string;
      confidence?: number;
      date_created: string;
      date_updated: string;
    };
    organization_id: string;
  }
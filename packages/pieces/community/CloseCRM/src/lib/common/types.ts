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
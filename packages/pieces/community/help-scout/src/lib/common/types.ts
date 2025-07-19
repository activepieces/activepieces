export interface Conversation {
  id: number;
  number: number;
  threads: number;
  type: 'email' | 'chat' | 'phone';
  folderId: number;
  status: 'active' | 'closed' | 'pending' | 'spam';
  state: 'draft' | 'published' | 'deleted';
  subject: string;
  preview: string;
  mailboxId: number;
  assignee?: User;
  createdBy: Person;
  createdAt: string;
  closedAt?: string;
  closedBy?: User;
  closedByUser?: User;
  userUpdatedAt: string;
  customerWaitingSince?: {
    time: string;
    friendly: string;
  };
  source: {
    type: string;
    via: string;
  };
  tags?: Tag[];
  cc?: string[];
  bcc?: string[];
  primaryCustomer: Customer;
  customFields?: CustomField[];
  _embedded?: {
    threads?: Thread[];
  };
}

export interface Thread {
  id: number;
  type: 'customer' | 'message' | 'note' | 'lineitem' | 'forwardparent' | 'forwardchild' | 'chat';
  status: 'active' | 'closed' | 'pending' | 'spam';
  state: 'draft' | 'published' | 'deleted' | 'underreview';
  action?: {
    type: string;
    text: string;
    associatedEntities?: any;
  };
  body: string;
  source: {
    type: string;
    via: string;
  };
  customer?: Customer;
  createdBy: Person;
  assignedTo?: User;
  savedReplyId?: number;
  to?: string[];
  cc?: string[];
  bcc?: string[];
  createdAt: string;
  attachments?: Attachment[];
  _embedded?: {
    attachments?: Attachment[];
  };
}

export interface Customer {
  id: number;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email: string;
  gender?: 'male' | 'female' | 'unknown';
  age?: string;
  organization?: string;
  jobTitle?: string;
  location?: string;
  timezone?: string;
  language?: string;
  createdAt: string;
  updatedAt: string;
  background?: string;
  address?: Address;
  social?: SocialProfile[];
  emails?: Email[];
  phones?: Phone[];
  websites?: Website[];
  properties?: Record<string, any>;
  _embedded?: {
    emails?: Email[];
    phones?: Phone[];
    social?: SocialProfile[];
    websites?: Website[];
  };
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  timezone: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
  type: 'user' | 'team';
}

export interface Person {
  id: number;
  type: 'user' | 'customer' | 'team';
  email?: string;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
  slug: string;
}

export interface CustomField {
  id: number;
  name: string;
  value: any;
  text?: string;
}

export interface Attachment {
  id: number;
  filename: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  url: string;
}

export interface Address {
  lines?: string[];
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface Email {
  id: number;
  value: string;
  type: 'work' | 'home' | 'other';
}

export interface Phone {
  id: number;
  value: string;
  type: 'work' | 'home' | 'mobile' | 'fax' | 'pager' | 'other';
}

export interface Website {
  id: number;
  value: string;
}

export interface SocialProfile {
  id: number;
  type: 'twitter' | 'facebook' | 'linkedin' | 'instagram' | 'googleplus';
  value: string;
}

export interface Mailbox {
  id: number;
  name: string;
  slug: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookPayload {
  id: string;
  type: string;
  data: any;
  timestamp: string;
}
import { HttpMessageBody } from '@activepieces/pieces-common';
interface VboutResponseBody<T> extends HttpMessageBody {
  response: {
    header: {
      status: string;
      dataType: string;
      limit: string;
      cached?: string;
    };
    data: T;
  };
}
export interface ContactList {
  id: string;
  name: string;
}

export interface ContactListsListResponse
  extends VboutResponseBody<{
    lists: {
      count: number;
      items: ContactList[];
    };
  }> {}

export interface EmailListCreateRequest {
  name: string;
  email_subject?: string;
  reply_to?: string;
  fromemail?: string;
  from_name?: string;
  doubleOptin?: boolean;
  notify?: string;
  notify_email?: string;
  success_email?: string;
  success_message?: string;
  error_message?: string;
  confirmation_email?: string;
  confirmation_message?: string;
  communications?: boolean;
}

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

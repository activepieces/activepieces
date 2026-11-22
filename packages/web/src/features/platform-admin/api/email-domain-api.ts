import {
  AddEmailDomainRequest,
  EmailDomain,
  EmailDomainWithUsage,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const emailDomainApi = {
  list() {
    return api.get<EmailDomainWithUsage[]>('/v1/email-domains');
  },
  add(request: AddEmailDomainRequest) {
    return api.post<EmailDomain>('/v1/email-domains', request);
  },
  verify(id: string) {
    return api.post<EmailDomain>(`/v1/email-domains/${id}/verify`, {});
  },
  remove(id: string) {
    return api.delete<void>(`/v1/email-domains/${id}`);
  },
};

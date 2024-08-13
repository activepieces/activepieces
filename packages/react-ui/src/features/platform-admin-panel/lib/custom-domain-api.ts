import { api } from '@/lib/api';
import { AddDomainRequest, CustomDomain } from '@activepieces/ee-shared';
import { SeekPage } from '@activepieces/shared';

type HostnameDetailsResponse = {
  txtName: string;
  txtValue: string;
  hostname: string;
};

export const customDomainApi = {
  list() {
    return api.get<SeekPage<CustomDomain>>('/v1/custom-domains');
  },
  delete(keyId: string) {
    return api.delete(`/v1/custom-domains/${keyId}`);
  },
  create(request: AddDomainRequest) {
    return api.post<{
      customDomain: CustomDomain;
      cloudflareHostnameData: HostnameDetailsResponse | null;
    }>('/v1/custom-domains/', request);
  },
  verifyDomain(keyId: string) {
    return api.patch<{ status: string }>(
      `/v1/custom-domains/verify/${keyId}`,
      {},
    );
  },
  validationData(keyId: string) {
    return api.get<HostnameDetailsResponse>(
      `/v1/custom-domains/validation/${keyId}`,
    );
  },
};

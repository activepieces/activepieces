import { CreateTrialLicenseKeyRequestBody } from '@activepieces/shared';

import { api } from './api';
import { flagsApi } from './flags-api';

export const requestTrialApi = {
  createKey(params: CreateTrialLicenseKeyRequestBody): Promise<void> {
    return api.post<void>(`/v1/license-keys`, params);
  },
  async contactSales(params: ContactSalesRequest): Promise<void> {
    const flags = await flagsApi.getAll();
    return api.post<void>(
      `https://sales.activepieces.com/submit-inapp-contact-form`,
      {
        ...params,
        flags: flags,
      },
    );
  },
};

type ContactSalesRequest = {
  fullName: string;
  email: string;
  companyName: string;
  goal: string;
  numberOfEmployees: string;
};

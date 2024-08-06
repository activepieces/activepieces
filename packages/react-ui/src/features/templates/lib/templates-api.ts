import { FlowTemplate } from '@activepieces/shared';

import { api } from '@/lib/api';

export const templatesApi = {
  getTemplate(templateId: string) {
    return api.get<FlowTemplate>(`/v1/flow-templates/${templateId}`);
  },
  create(request: any) {
    return api.post<FlowTemplate>(`/v1/flow-templates`, request);
  },
};

import { api } from '@/lib/api';
import { CreateFlowTemplateRequest } from '@activepieces/ee-shared';
import { FlowTemplate } from '@activepieces/shared';

export const templatesApi = {
  getTemplate(templateId: string) {
    return api.get<FlowTemplate>(`/v1/flow-templates/${templateId}`);
  },
  create(request: CreateFlowTemplateRequest) {
    return api.post<FlowTemplate>(`/v1/flow-templates`, request);
  },
};

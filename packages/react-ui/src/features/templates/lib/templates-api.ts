import { api } from '@/lib/api';
import { CreateFlowTemplateRequest } from '@activepieces/ee-shared';
import {
  FlowTemplate,
  ListFlowTemplatesRequest,
  SeekPage,
} from '@activepieces/shared';

export const templatesApi = {
  getTemplate(templateId: string) {
    return api.get<FlowTemplate>(`/v1/flow-templates/${templateId}`);
  },
  create(request: CreateFlowTemplateRequest) {
    return api.post<FlowTemplate>(`/v1/flow-templates`, request);
  },
  list(request?: ListFlowTemplatesRequest) {
    return api.get<SeekPage<FlowTemplate>>(`/v1/flow-templates`, request ?? {});
  },
  delete(templateId: string) {
    return api.delete<void>(`/v1/flow-templates/${templateId}`);
  },
};

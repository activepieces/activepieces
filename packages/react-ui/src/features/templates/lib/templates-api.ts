import { api } from '@/lib/api';
import {
  CreateTemplateRequestBody,
  ListTemplatesRequestQuery,
  Template,
  SeekPage,
  UpdateTemplateRequestBody,
} from '@activepieces/shared';

export const templatesApi = {
  getTemplate(templateId: string) {
    return api.get<Template>(`/v1/templates/${templateId}`);
  },
  create(request: CreateTemplateRequestBody) {
    return api.post<Template>(`/v1/templates`, request);
  },
  update(templateId: string, request: UpdateTemplateRequestBody) {
    return api.post<Template>(`/v1/templates/${templateId}`, request);
  },
  list(request: ListTemplatesRequestQuery) {
    return api.get<SeekPage<Template>>(`/v1/templates`, request);
  },
  delete(templateId: string) {
    return api.delete<void>(`/v1/templates/${templateId}`);
  },
  incrementUsageCount(templateId: string) {
    return api.post<void>(`/v1/templates/${templateId}/increment-usage-count`);
  },
};

import { SeekPage } from '@activepieces/core-utils';
import {
  CreateTemplateRequestBody,
  ListTemplatesRequestQuery,
  Template,
  UpdateTemplateRequestBody,
  Flag,
} from '@activepieces/shared';

import { api } from '@/lib/api';

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
  getCategories() {
    return api.get<Flag>(`/v1/templates/categories`);
  },
};

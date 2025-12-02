import { api } from '@/lib/api';
import {
  CreateTemplateRequestBody,
  ListTemplatesRequestQuery,
  PopulatedTemplate,
  SeekPage,
  UpdateTemplateRequestBody,
} from '@activepieces/shared';

export const templatesApi = {
  getTemplate(templateId: string) {
    return api.get<PopulatedTemplate>(`/v1/templates/custom/${templateId}`);
  },
  create(request: CreateTemplateRequestBody) {
    return api.post<PopulatedTemplate>(`/v1/templates/custom`, request);
  },
  update(templateId: string, request: UpdateTemplateRequestBody) {
    return api.post<PopulatedTemplate>(
      `/v1/templates/custom/${templateId}`,
      request,
    );
  },
  list(request?: ListTemplatesRequestQuery) {
    return api.get<SeekPage<PopulatedTemplate>>(
      `/v1/templates/custom`,
      request ?? {},
    );
  },
  delete(templateId: string) {
    return api.delete<void>(`/v1/templates/custom/${templateId}`);
  },
};

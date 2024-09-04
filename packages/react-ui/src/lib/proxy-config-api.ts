import { api } from '@/lib/api';
import {
  ProjectWithLimits,
  ProxyConfig,
  SeekPage
} from '@activepieces/shared';

export const proxyConfigApi = {
  list() {
    return api.get<SeekPage<ProxyConfig>>('/v1/proxy/config');
  },
  update(id: string, request: Partial<ProxyConfig>) { 
    return api.patch<ProxyConfig>(`/v1/proxy/config/${id}`, request);
  },
  create(request: ProxyConfig) {
    return api.post<ProxyConfig>('/v1/proxy/config', request);
  },
  delete(provider: string) {
    return api.delete(`/v1/proxy/config/${provider}`);
  }
};

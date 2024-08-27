import { apId, PlatformId, ProxyConfig } from "@activepieces/shared";
import { repoFactory } from "../core/db/repo-factory";
import { ProxyConfigEntity } from "./proxy-config-entity";


const repo = repoFactory(ProxyConfigEntity)

export const platformProxyConfigService = {

  async get(platformId: PlatformId, provider: string): Promise<ProxyConfig | null> {
    const builder = repo().createQueryBuilder()
    return builder.where({
      platformId,
      projectId: null,
      provider,
    }).getOne()
  },

  async create(platformId: PlatformId, proxyConfig: ProxyConfig): Promise<ProxyConfig> {
    
    const existingProxyConfig = await platformProxyConfigService.get(platformId, proxyConfig.provider)
    if (existingProxyConfig) {
      return existingProxyConfig
    }

    return repo().save({ ...proxyConfig, platformId, projectId: null, id: apId() })
  },

  async upsert(platformId: PlatformId, proxyConfig: ProxyConfig): Promise<ProxyConfig> {
    return repo().save({ ...proxyConfig, platformId, projectId: null })
  },

  async delete(platformId: PlatformId, provider: string): Promise<void> {
    const builder = repo().createQueryBuilder()
    
    await builder.delete().where({
      platformId,
      projectId: null,
      provider,
    }).execute()
  },

  async list(platformId: PlatformId): Promise<ProxyConfig[]> {
    const builder = repo().createQueryBuilder()

    
    return builder.where({
      platformId,
      projectId: null,
    }).getMany()
  },
}
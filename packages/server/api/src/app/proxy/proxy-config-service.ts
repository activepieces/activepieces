import { ActivepiecesError, apId, ErrorCode, isNil, PlatformId, ProxyConfig } from "@activepieces/shared";
import { repoFactory } from "../core/db/repo-factory";
import { ProxyConfigEntity } from "./proxy-config-entity";


const repo = repoFactory(ProxyConfigEntity)

export const proxyConfigService = {
  async getOrThrow({
    platformId,
    provider,
  }: GetParams): Promise<ProxyConfig> {
    const config = await repo().findOneBy({
      platformId,
      provider,
    })
    if (isNil(config)) {
      throw new ActivepiecesError({
        code: ErrorCode.ENTITY_NOT_FOUND,
        params: {
          entityId: `${platformId}-${provider}`,
          entityType: 'proxy_config',
        },
      })
    }
    return config
  },
  async upsert(proxyConfig: ProxyConfig): Promise<ProxyConfig> {
    await repo().upsert({ ...proxyConfig }, ['platformId', 'provider'])
    return this.getOrThrow(proxyConfig)
  },
  async delete(platformId: PlatformId, provider: string): Promise<void> {
    await repo().delete({
      platformId,
      provider,
    })
  },
  async list(platformId: PlatformId): Promise<ProxyConfig[]> {
    return repo().findBy({
      platformId,
    })
  },
}

type GetParams = {
  platformId: PlatformId
  provider: string
}
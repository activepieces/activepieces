import { ActivepiecesError, apId, ErrorCode, isNil, PlatformId, ProxyConfig, SeekPage } from "@activepieces/shared";
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
  async update({ id, platformId, proxyConfig }: UpdateParams): Promise<void> {
    await repo().update({ id, platformId }, proxyConfig)
  },
  async create(proxyConfig: Omit<ProxyConfig, 'id' | 'created' | 'updated'>): Promise<ProxyConfig> {
    return await repo().save({ ...proxyConfig, id: apId() })
  },
  async delete({ id, platformId }: DeleteParams): Promise<void> {
    await repo().delete({ id, platformId })
  },
  async list(platformId: PlatformId): Promise<SeekPage<ProxyConfig>> {
    const configs = await repo().findBy({
      platformId,
    })

    return {
      data: configs,
      next: null,
      previous: null,
    }
  },
}

type UpdateParams = { id: string, platformId: PlatformId, proxyConfig: Partial<ProxyConfig> }
type DeleteParams = {
  id: string
  platformId: PlatformId
}
type GetParams = {
  platformId: PlatformId
  provider: string
}
import { apId, ProjectId, ProxyConfig } from "@activepieces/shared";
import { repoFactory } from "../core/db/repo-factory";
import { ProxyConfigEntity } from "./proxy-config-entity";
import { projectService } from "../project/project-service";
import { platformProxyConfigService } from "./platform-proxy-config-service";


const repo = repoFactory(ProxyConfigEntity)

export const projectProxyConfigService = {

  async get(projectId: ProjectId, provider: string): Promise<ProxyConfig | null> {
    const builder = repo().createQueryBuilder()

    const platform = await projectService.getOneOrThrow(projectId)

    const projectProxyConfig = await builder.where({
      platformId: platform.id,
      projectId,
      provider,
    }).getOne()

    if (projectProxyConfig) {
      return projectProxyConfig
    }

    return platformProxyConfigService.get(platform.id, provider)
  },

  async create(projectId: ProjectId, proxyConfig: ProxyConfig): Promise<ProxyConfig> {
    const platformId = await projectService.getOneOrThrow(projectId)
    const existingProxyConfig = await projectProxyConfigService.get(projectId, proxyConfig.provider)
    if (existingProxyConfig) {
      return existingProxyConfig
    }

    return repo().save({ ...proxyConfig, platformId, projectId, id: apId() })
  },

  async upsert(projectId: ProjectId, proxyConfig: ProxyConfig): Promise<ProxyConfig> {
    const platformId = await projectService.getOneOrThrow(projectId)
    return repo().save({ ...proxyConfig, platformId, projectId })
  },

  async delete(projectId: ProjectId, provider: string): Promise<void> {
    const builder = repo().createQueryBuilder()
    const platformId = await projectService.getOneOrThrow(projectId)

    await builder.delete().where({
      platformId,
      projectId,
      provider,
    }).execute()
  },

  async list(projectId: ProjectId): Promise<ProxyConfig[]> {
    const builder = repo().createQueryBuilder()

    const platformId = await projectService.getOneOrThrow(projectId)
    return builder.where({
      platformId,
      projectId,
    }).getMany()
  },
}
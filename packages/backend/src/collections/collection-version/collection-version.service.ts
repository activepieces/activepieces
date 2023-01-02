import {
  apId,
  CollectionId,
  CollectionVersion,
  CollectionVersionId,
  CollectionVersionState,
  ConfigType,
  UpdateCollectionRequest,
} from "shared";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { databaseConnection } from "../../database/database-connection";
import { ActivepiecesError, ErrorCode } from "../../helper/activepieces-error";
import { oauth2Service } from "../../oauth2/oauth2.service";
import { CollectionVersionEntity } from "./collection-version-entity";

const collectionVersionRepo = databaseConnection.getRepository(CollectionVersionEntity);

export const collectionVersionService = {
  async updateVersion(
    collectionVersionId: CollectionVersionId,
    request: UpdateCollectionRequest
  ): Promise<CollectionVersion | null> {
    await collectionVersionRepo.update(collectionVersionId, request as QueryDeepPartialEntity<CollectionVersion>);
    return await collectionVersionRepo.findOneBy({
      id: collectionVersionId,
    });
  },

  async getOne(id: CollectionVersionId): Promise<CollectionVersion | null> {
    let version = await collectionVersionRepo.findOneBy({
      id,
    });
    if (version === null) {
      return null;
    }
    return refreshAndUpdateCollection(version);
  },
  async getOneOrThrow(id: CollectionVersionId): Promise<CollectionVersion> {
    const collectionVersion = await collectionVersionService.getOne(id);

    if (collectionVersion === null) {
      throw new ActivepiecesError({
        code: ErrorCode.COLLECTION_VERSION_NOT_FOUND,
        params: {
          id,
        },
      });
    }

    return collectionVersion;
  },

  async getCollectionVersionId(
    collectionId: CollectionId,
    versionId: CollectionVersionId | null
  ): Promise<CollectionVersion | null> {
    let version = await collectionVersionRepo.findOne({
      where: {
        collectionId,
        id: versionId ?? undefined,
      },
      order: {
        created: "DESC",
      },
    });
    if (version === null) {
      return null;
    }
    return refreshAndUpdateCollection(version);
  },

  async createVersion(collectionId: CollectionId, request: UpdateCollectionRequest): Promise<CollectionVersion> {
    const collectionVersion: Partial<CollectionVersion> = {
      id: apId(),
      displayName: request.displayName,
      collectionId,
      configs: request.configs,
      state: CollectionVersionState.DRAFT,
    };
    return await collectionVersionRepo.save(collectionVersion);
  },
};

async function refreshAndUpdateCollection(collectionVersion: Readonly<CollectionVersion>): Promise<CollectionVersion> {
  let clonedVersion: CollectionVersion = JSON.parse(JSON.stringify(collectionVersion));
  let refreshedConfigs = false;
  for (let i = 0; i < clonedVersion.configs.length; ++i) {
    let config = clonedVersion.configs[i];
    if (config.type === ConfigType.CLOUD_OAUTH2 || config.type == ConfigType.OAUTH2) {
      const secondsSinceEpoch = Math.round(Date.now() / 1000);
      if (config.value.expires_in === undefined || config.value.refresh_token === undefined) continue;
      // Refresh if there is less than 15 minutes to expire
      if (config.value.claimed_at + config.value.expires_in + 15 * 60 <= secondsSinceEpoch) {
        refreshedConfigs = true;
        try {
          let response = await oauth2Service.refresh(config);
          config.value = response;
        } catch (e) {
          console.error(e);
          /// There is nothing to do other than wait for the 3P service code to work in next 15 minutes, and throw an error.
        }
      }
    }
  }
  if (refreshedConfigs) {
    await collectionVersionService.updateVersion(clonedVersion.id, clonedVersion);
  }
  return clonedVersion;
}

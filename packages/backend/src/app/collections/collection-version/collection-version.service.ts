import {
  apId,
  CollectionId,
  CollectionVersion,
  CollectionVersionId,
  CollectionVersionState,
  UpdateCollectionRequest,
} from "@activepieces/shared";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { databaseConnection } from "../../database/database-connection";
import { ActivepiecesError, ErrorCode } from "@activepieces/shared";
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
    return version;
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
    return version;
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



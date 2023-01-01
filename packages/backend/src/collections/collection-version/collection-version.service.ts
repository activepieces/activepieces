import {
  apId,
  CollectionId,
  CollectionVersion,
  CollectionVersionId,
  CollectionVersionState,
  UpdateCollectionRequest,
} from "shared";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { collectionVersionRepo } from "./collection-version-repo";

export const collectionVersionService = {
  async updateVersion(
    collectionVersion: CollectionVersion,
    request: UpdateCollectionRequest
  ): Promise<CollectionVersion | null> {
    await collectionVersionRepo.update(collectionVersion.id, request as QueryDeepPartialEntity<CollectionVersion>);
    return await collectionVersionRepo.findOneBy({
      id: collectionVersion.id,
    });
  },

  async getOne(id: CollectionVersionId): Promise<CollectionVersion | null> {
    return await collectionVersionRepo.findOneBy({
      id,
    });
  },

  async getCollectionVersionId(
    collectionId: CollectionId,
    versionId: CollectionVersionId | null
  ): Promise<CollectionVersion | null> {
    return await collectionVersionRepo.findOne({
      where: {
        collectionId,
        id: versionId ?? undefined,
      },
      order: {
        created: "DESC",
      },
    });
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

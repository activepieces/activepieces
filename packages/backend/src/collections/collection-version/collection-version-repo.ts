import { databaseConnection } from "../../database/database-connection";
import { CollectionVersionEntity } from "./collection-version-entity";

export const collectionVersionRepo = databaseConnection.getRepository(CollectionVersionEntity);

import { databaseConnection } from '../database/database-connection';
import {CollectionEntity} from "./collection-entity";
import {Collection, CollectionVersion} from "shared";
import {CollectionVersionEntity} from "../entity/collection-version";

export const collectionRepo = databaseConnection.getRepository<Collection>(CollectionEntity);
export const collectionVersionRepo = databaseConnection.getRepository<CollectionVersion>(CollectionVersionEntity);

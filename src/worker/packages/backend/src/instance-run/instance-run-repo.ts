import { InstanceRunEntity } from "./instance-run-entity";
import { databaseConnection } from "../database/database-connection";

export const instanceRunRepo = databaseConnection.getRepository(InstanceRunEntity);

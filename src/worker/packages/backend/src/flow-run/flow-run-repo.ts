import { FlowRunEntity } from "./flow-run-entity";
import { databaseConnection } from "../database/database-connection";

export const flowRunRepo = databaseConnection.getRepository(FlowRunEntity);

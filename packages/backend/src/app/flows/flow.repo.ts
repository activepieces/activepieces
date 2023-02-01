import { databaseConnection } from "../database/database-connection";
import { FlowEntity } from "./flow.entity";

export const flowRepo = databaseConnection.getRepository(FlowEntity);

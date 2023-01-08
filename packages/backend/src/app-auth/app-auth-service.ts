import { databaseConnection } from "../database/database-connection";
import { apId, AppAuth, UpsertAuthAppRequest, UserId } from "shared";
import { AppAuthEntity } from "./app-auth-entity";

const appAuthRepo = databaseConnection.getRepository(AppAuthEntity);

export const appAuthService = {

};

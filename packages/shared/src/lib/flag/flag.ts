import { BaseModel } from "../common/base-model";
import { ApId } from "../common/id-generator";

export type FlagId = ApId;

export interface Flag extends BaseModel<FlagId> {
    value: unknown;
}

export enum ApFlagId {
    FRONTEND_URL = "FRONTEND_URL",
    BACKEND_URL = "BACKEND_URL",
    USER_CREATED = "USER_CREATED",
    SIGN_UP_ENABLED = "SIGN_UP_ENABLED",
    TELEMETRY_ENABLED = "TELEMETRY_ENABLED",
    CURRENT_VERSION = "CURRENT_VERSION",
    LATEST_VERSION = "LATEST_VERSION",
    WARNING_TEXT_BODY = "WARNING_TEXT_BODY",
    WARNING_TEXT_HEADER = "WARNING_TEXT_HEADER",
}

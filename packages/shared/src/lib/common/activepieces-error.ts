import { AppConnectionId } from "../app-connection/app-connection";
import { CollectionId } from "../collections/collection";
import { FileId } from "../file/file";
import { FlowRunId } from "../flow-run/flow-run";
import { FlowId } from "../flows/flow";
import { FlowVersionId } from "../flows/flow-version";
import { InstanceId } from "../instance";
import { ApId } from "./id-generator";

export class ActivepiecesError extends Error {
  constructor(public error: ErrorParams, message?: string) {
    super(error.code + (message ? `: ${message}` : ""));
  }
}

type ErrorParams =
  | CollectionNotFoundErrorParams
  | ConfigNotFoundErrorParams
  | ExistingUserErrorParams
  | FileNotFoundErrorParams
  | FlowNotFoundErrorParams
  | FlowRunNotFoundErrorParams
  | FlowVersionNotFoundErrorParams
  | InstanceNotFoundErrorParams
  | InvalidBearerTokenParams
  | InvalidCredentialsErrorParams
  | JobRemovalFailureErrorParams
  | PieceNotFoundErrorParams
  | PieceTriggerNotFoundErrorParams
  | StepNotFoundErrorParams
  | AppConnectionNotFoundErrorParams
  | InvalidClaimParams
  | InvalidCloudClaimParams
  | InvalidJwtTokenErrorParams
  | TaskQuotaExeceededErrorParams
  | SystemInvalidErrorParams
  | SystemPropNotDefinedErrorParams
  | FlowOperationErrorParams;


export interface BaseErrorParams<T, V> {
  code: T;
  params: V;
}

export type InvalidClaimParams = BaseErrorParams<ErrorCode.INVALID_CLAIM, { redirectUrl: string, tokenUrl: string, clientId: string }>
export type InvalidCloudClaimParams = BaseErrorParams<ErrorCode.INVALID_CLOUD_CLAIM, { appName: string }>

export type InvalidBearerTokenParams = BaseErrorParams<ErrorCode.INVALID_BEARER_TOKEN, Record<string, null>>;

export type FileNotFoundErrorParams = BaseErrorParams<ErrorCode.FILE_NOT_FOUND, { id: FileId }>;

export type AppConnectionNotFoundErrorParams = BaseErrorParams<
  ErrorCode.APP_CONNECTION_NOT_FOUND,
  {
    id: AppConnectionId;
  }
>;

export type SystemInvalidErrorParams = BaseErrorParams<
  ErrorCode.SYSTEM_PROP_INVALID,
  {
    prop: string;
  }
>;

export type FlowNotFoundErrorParams = BaseErrorParams<
  ErrorCode.FLOW_NOT_FOUND,
  {
    id: FlowId;
  }
>

export type CollectionNotFoundErrorParams = BaseErrorParams<
  ErrorCode.COLLECTION_NOT_FOUND,
  {
    id: CollectionId;
  }
>

export type InstanceNotFoundErrorParams = BaseErrorParams<
  ErrorCode.INSTANCE_NOT_FOUND,
  {
    id?: InstanceId;
    collectionId?: CollectionId;
  }
>

export type FlowRunNotFoundErrorParams = BaseErrorParams<
  ErrorCode.INSTANCE_NOT_FOUND,
  {
    id: FlowRunId;
  }
>

export type FlowVersionNotFoundErrorParams = BaseErrorParams<
  ErrorCode.FLOW_VERSION_NOT_FOUND,
  {
    id: FlowVersionId;
  }
>

export type InvalidCredentialsErrorParams = BaseErrorParams<
  ErrorCode.INVALID_CREDENTIALS,
  {
    email: string;
  }
>

export type ExistingUserErrorParams = BaseErrorParams<
  ErrorCode.EXISTING_USER,
  {
    email: string;
  }
>

export type StepNotFoundErrorParams = BaseErrorParams<
  ErrorCode.STEP_NOT_FOUND,
  {
    pieceName: string;
    pieceVersion: string;
    stepName: string;
  }
>

export type PieceNotFoundErrorParams = BaseErrorParams<
  ErrorCode.PIECE_NOT_FOUND,
  {
    pieceName: string;
    pieceVersion: string;
  }
>

export type PieceTriggerNotFoundErrorParams = BaseErrorParams<
  ErrorCode.PIECE_TRIGGER_NOT_FOUND,
  {
    pieceName: string;
    pieceVersion: string;
    triggerName: string;
  }
>

export type ConfigNotFoundErrorParams = BaseErrorParams<
  ErrorCode.CONFIG_NOT_FOUND,
  {
    pieceName: string;
    pieceVersion: string;
    stepName: string;
    configName: string;
  }
>

export type JobRemovalFailureErrorParams = BaseErrorParams<
  ErrorCode.JOB_REMOVAL_FAILURE,
  {
    jobId: ApId;
  }
>

export type SystemPropNotDefinedErrorParams = BaseErrorParams<
  ErrorCode.SYSTEM_PROP_NOT_DEFINED,
  {
    prop: string;
  }
>;

export type FlowOperationErrorParams = BaseErrorParams<
  ErrorCode.FLOW_OPERATION_INVALID,
  Record<string, never>
>;

export type InvalidJwtTokenErrorParams = BaseErrorParams<
  ErrorCode.INVALID_OR_EXPIRED_JWT_TOKEN,
  {
    token: string;
  }
>

export type TaskQuotaExeceededErrorParams = BaseErrorParams<
  ErrorCode.TASK_QUOTA_EXCEEDED,
  {
    projectId: string;
  }
>

export enum ErrorCode {
  COLLECTION_NOT_FOUND = "COLLECTION_NOT_FOUND",
  COLLECTION_VERSION_NOT_FOUND = "COLLECTION_VERSION_NOT_FOUND",
  CONFIG_NOT_FOUND = "CONFIG_NOT_FOUND",
  EXISTING_USER = "EXISTING_USER",
  APP_CONNECTION_NOT_FOUND = "APP_CONNECTION_NOT_FOUND",
  FILE_NOT_FOUND = "FILE_NOT_FOUND",
  FLOW_NOT_FOUND = "FLOW_NOT_FOUND",
  FLOW_RUN_NOT_FOUND = "INSTANCE_NOT_FOUND",
  FLOW_VERSION_NOT_FOUND = "FLOW_VERSION_NOT_FOUND",
  INSTANCE_NOT_FOUND = "INSTANCE_NOT_FOUND",
  INVALID_BEARER_TOKEN = "INVALID_BEARER_TOKEN",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  JOB_REMOVAL_FAILURE = "JOB_REMOVAL_FAILURE",
  PIECE_NOT_FOUND = "PIECE_NOT_FOUND",
  PIECE_TRIGGER_NOT_FOUND = "PIECE_TRIGGER_NOT_FOUND",
  STEP_NOT_FOUND = "STEP_NOT_FOUND",
  SYSTEM_PROP_NOT_DEFINED = "SYSTEM_PROP_NOT_DEFINED",
  INVALID_CLAIM = "INVALID_CLAIM",
  INVALID_CLOUD_CLAIM = "INVALID_CLOUD_CLAIM",
  INVALID_OR_EXPIRED_JWT_TOKEN = "INVALID_OR_EXPIRED_JWT_TOKEN",
  TASK_QUOTA_EXCEEDED = "TASK_QUOTA_EXCEEDED",
  SYSTEM_PROP_INVALID = "SYSTEM_PROP_INVALID",
  FLOW_OPERATION_INVALID = "FLOW_OPERATION_INVALID",
}

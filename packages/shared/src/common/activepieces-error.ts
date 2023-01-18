import { AppConnectionId } from "../app-connection/app-connection";
import { CollectionId } from "../collections/collection";
import { CollectionVersionId } from "../collections/collection-version";
import { FileId } from "../file/file";
import { FlowRunId } from "../flow-run/flow-run";
import { FlowId } from "../flows/flow";
import { FlowVersionId } from "../flows/flow-version";
import { InstanceId } from "../instance";
import { ApId } from "./id-generator";

export class ActivepiecesError extends Error {
  constructor(public error: ErrorParams) {
    super(error.code);
  }
}

type ErrorParams =
  | CollectionNotFoundErrorParams
  | CollectionVersionNotFoundErrorParams
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
  | SystemPropNotDefinedErrorParams;

export interface BaseErrorParams<T, V> {
  code: T;
  params: V;
}

export interface InvalidBearerTokenParams extends BaseErrorParams<ErrorCode.INVALID_BEARER_TOKEN, {}> { }

export interface FileNotFoundErrorParams extends BaseErrorParams<ErrorCode.FILE_NOT_FOUND, { id: FileId }> { }

export interface AppConnectionNotFoundErrorParams
  extends BaseErrorParams<
    ErrorCode.APP_CONNECTION_NOT_FOUND,
    {
      id: AppConnectionId;
    }
  > { }

export interface FlowNotFoundErrorParams
  extends BaseErrorParams<
    ErrorCode.FLOW_NOT_FOUND,
    {
      id: FlowId;
    }
  > { }

export interface CollectionNotFoundErrorParams
  extends BaseErrorParams<
    ErrorCode.COLLECTION_NOT_FOUND,
    {
      id: CollectionId;
    }
  > { }

export interface CollectionVersionNotFoundErrorParams
  extends BaseErrorParams<
    ErrorCode.COLLECTION_VERSION_NOT_FOUND,
    {
      id: CollectionVersionId;
    }
  > { }

export interface InstanceNotFoundErrorParams
  extends BaseErrorParams<
    ErrorCode.INSTANCE_NOT_FOUND,
    {
      id?: InstanceId;
      collectionId?: CollectionId;
    }
  > { }

export interface FlowRunNotFoundErrorParams
  extends BaseErrorParams<
    ErrorCode.INSTANCE_NOT_FOUND,
    {
      id: FlowRunId;
    }
  > { }

export interface FlowVersionNotFoundErrorParams
  extends BaseErrorParams<
    ErrorCode.FLOW_VERSION_NOT_FOUND,
    {
      id: FlowVersionId;
    }
  > { }

export interface InvalidCredentialsErrorParams
  extends BaseErrorParams<
    ErrorCode.INVALID_CREDENTIALS,
    {
      email: string;
    }
  > { }

export interface ExistingUserErrorParams
  extends BaseErrorParams<
    ErrorCode.EXISTING_USER,
    {
      email: string;
    }
  > { }

export interface StepNotFoundErrorParams
  extends BaseErrorParams<
    ErrorCode.STEP_NOT_FOUND,
    {
      pieceName: string;
      stepName: string;
    }
  > { }

export interface PieceNotFoundErrorParams
  extends BaseErrorParams<
    ErrorCode.PIECE_NOT_FOUND,
    {
      pieceName: string;
    }
  > { }

export interface PieceTriggerNotFoundErrorParams
  extends BaseErrorParams<
    ErrorCode.PIECE_TRIGGER_NOT_FOUND,
    {
      pieceName: string;
      triggerName: string;
    }
  > { }

export interface ConfigNotFoundErrorParams
  extends BaseErrorParams<
    ErrorCode.CONFIG_NOT_FOUND,
    {
      pieceName: string;
      stepName: string;
      configName: string;
    }
  > { }

export interface JobRemovalFailureErrorParams
  extends BaseErrorParams<
    ErrorCode.JOB_REMOVAL_FAILURE,
    {
      jobId: ApId;
    }
  > { }

export interface SystemPropNotDefinedErrorParams
  extends BaseErrorParams<
    ErrorCode.SYSTEM_PROP_NOT_DEFINED,
    {
      prop: string;
    }
  > { }

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
}

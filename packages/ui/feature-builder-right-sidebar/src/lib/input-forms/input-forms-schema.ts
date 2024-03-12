import {
  TriggerType,
  ActionType,
  BranchCondition,
  PackageType,
  PieceType,
  SourceCode,
  LoopOnItemsActionSettings,
  ActionErrorHandlingOptions,
} from '@activepieces/shared';
declare type ConfigsAndTheirValues = { [key: string]: any };
interface InputFormsSchemaBase {
  type?: ActionType | TriggerType;
}
export interface LoopStepInputFormSchema
  extends InputFormsSchemaBase,
    LoopOnItemsActionSettings {}
export interface CodeStepInputFormSchema extends InputFormsSchemaBase {
  sourceCode: SourceCode;
  input: Record<string, unknown>;
  errorHandlingOptions: ActionErrorHandlingOptions;
}

export interface BranchInputFormSchema extends InputFormsSchemaBase {
  conditions: BranchCondition[][];
}

export interface ScheduledTriggerInputFormSchema extends InputFormsSchemaBase {
  cronExpression: string;
}

type CommonPieceFormsProps = {
  packageType: PackageType;
  pieceType: PieceType;
  pieceName: string;
  pieceDisplayName: string;
  pieceVersion: string;
};
export interface PieceActionInputFormSchema
  extends InputFormsSchemaBase,
    CommonPieceFormsProps {
  actionName: string;
  input: ConfigsAndTheirValues;
  inputUiInfo: {
    customizedInputs: Record<string, boolean>;
  };
  errorHandlingOptions?: ActionErrorHandlingOptions;
}

export interface PieceTriggerInputFormSchema
  extends InputFormsSchemaBase,
    CommonPieceFormsProps {
  triggerName: string;
  input: ConfigsAndTheirValues;
  inputUiInfo: {
    customizedInputs: Record<string, boolean>;
  };
}

export type InputFormsSchema =
  | LoopStepInputFormSchema
  | CodeStepInputFormSchema
  | PieceActionInputFormSchema;

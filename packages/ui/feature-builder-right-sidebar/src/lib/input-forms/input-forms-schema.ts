import {
  TriggerType,
  ActionType,
  BranchCondition,
  PackageType,
  PieceType,
  SourceCode,
} from '@activepieces/shared';
declare type ConfigsAndTheirValues = { [key: string]: any };
interface InputFormsSchemaBase {
  type?: ActionType | TriggerType;
}
export interface LoopStepInputFormSchema extends InputFormsSchemaBase {
  items: string;
}
export interface CodeStepInputFormSchema extends InputFormsSchemaBase {
  sourceCode: SourceCode;
  input: Record<string, unknown>;
}

export interface BranchInputFormSchema extends InputFormsSchemaBase {
  conditions: BranchCondition[][];
}

export interface ScheduledTriggerInputFormSchema extends InputFormsSchemaBase {
  cronExpression: string;
}

export interface PieceActionInputFormSchema extends InputFormsSchemaBase {
  packageType: PackageType;
  pieceType: PieceType;
  pieceName: string;
  pieceVersion: string;
  actionName: string;
  input: ConfigsAndTheirValues;
  inputUiInfo: {
    customizedInputs: Record<string, boolean>;
  };
}

export interface ComponentTriggerInputFormSchema extends InputFormsSchemaBase {
  packageType: PackageType;
  pieceType: PieceType;
  pieceName: string;
  pieceVersion: string;
  triggerName: string;
  input: ConfigsAndTheirValues;
}

export type InputFormsSchema =
  | LoopStepInputFormSchema
  | CodeStepInputFormSchema
  | ScheduledTriggerInputFormSchema
  | PieceActionInputFormSchema;

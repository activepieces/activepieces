import { FieldFormat } from '@/components/custom/smart-output-viewer/types';

export type DataSelectorTreeChunkNodeData = {
  type: 'chunk';
  displayName: string;
  displayNameClassName?: string;
};

export type DataSelectorTreeNodeData = {
  type: 'value';
  value: string | unknown;
  displayName: string;
  propertyPath: string;
  insertable: boolean;
  format?: FieldFormat;
  hideStepIcon?: boolean;
  displayNameClassName?: string;
  stepName?: string;
};

export type DataSelectorTestNodeData = {
  type: 'test';
  stepName: string;
  parentDisplayName: string;
};

export type DataSelectorTreeNodeDataUnion =
  | DataSelectorTreeNodeData
  | DataSelectorTreeChunkNodeData
  | DataSelectorTestNodeData;
export type DataSelectorTreeNode<
  T extends DataSelectorTreeNodeDataUnion = DataSelectorTreeNodeDataUnion,
> = {
  key: string;
  data: T;
  children?: DataSelectorTreeNode<DataSelectorTreeNodeDataUnion>[];
  isLoopStepNode?: boolean;
};

export type DataSelectorTreeChunkNodeData = {
  type: 'chunk';
  displayName: string;
};

export type DataSelectorTreeNodeData = {
  type: 'value';
  value: string | unknown;
  displayName: string;
  propertyPath: string;
  insertable: boolean;
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

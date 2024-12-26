export type MentionTreeChunkNodeData = {
  type: 'chunk';
  displayName: string;
};

export type MentionTreeNodeData = {
  type: 'value';
  value: string | unknown;
  displayName: string;
  propertyPath: string;
  insertable: boolean;
};

export type MentionTestNodeData = {
  type: 'test';
  stepName: string;
};

export type MentionTreeNodeDataUnion =
  | MentionTreeNodeData
  | MentionTreeChunkNodeData
  | MentionTestNodeData;
  export type MentionTreeNode<
  T extends MentionTreeNodeDataUnion = MentionTreeNodeDataUnion,
> = {
  key: string;
  data: T;
  children?: MentionTreeNode<MentionTreeNodeDataUnion>[];
};

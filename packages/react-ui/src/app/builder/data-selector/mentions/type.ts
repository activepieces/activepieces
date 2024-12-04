export type MentionTreeSliceNodeData = {
    type: 'slice',
    displayName: string;
}

export type MentionTreeNodeData = {
    type: 'value',
    value: string | unknown;
    displayName: string;
    propertyPath: string
    insertable: boolean;
}

export type MentionTestNodeData = {
    type: 'test',
    stepName: string;
}

export type MentionTreeNodeDataUnion = MentionTreeNodeData | MentionTreeSliceNodeData | MentionTestNodeData | StepTitleNodeData;
export type MentionTreeNode<T extends MentionTreeNodeDataUnion = MentionTreeNodeDataUnion> = {
    key: string;
    data: T;
    children?: MentionTreeNode<MentionTreeNodeDataUnion>[];
};
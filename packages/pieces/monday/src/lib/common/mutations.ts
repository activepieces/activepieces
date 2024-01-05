export const mondayGraphQLMutations = {
  createItem: `
  mutation createItem (
    $itemName: String!
    $boardId: ID!
    $groupId: String
    $columnValues: JSON
    $createLabels: Boolean
  ) {
    create_item (
      item_name: $itemName
      board_id: $boardId
      group_id: $groupId
      column_values: $columnValues
      create_labels_if_missing: $createLabels
    ) {
      id
    }
  }
  `,
  updateItem: `
  mutation updateItem (
    $itemId: ID!,
    $boardId: ID!,
    $columnValues: JSON!
  ){
    change_multiple_column_values(
      item_id: $itemId,
      board_id: $boardId,
      column_values: $columnValues
    ){
      id
      name
    }
  }
`,
};

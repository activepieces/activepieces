export const mondayGraphQLMutations = {
  createItem: `
  mutation createItem(
    $itemName: String!
    $boardId: ID!
    $groupId: String
    $columnValues: JSON
    $createLabels: Boolean
  ) {
    create_item(
      item_name: $itemName
      board_id: $boardId
      group_id: $groupId
      column_values: $columnValues
      create_labels_if_missing: $createLabels
    ) {
      id
    }
  }`,
  updateItem: `
  mutation updateItem($itemId: ID!, $boardId: ID!, $columnValues: JSON!) {
    change_multiple_column_values(
      item_id: $itemId
      board_id: $boardId
      column_values: $columnValues
    ) {
      id
      name
    }
  }`,
  createWebhook: `
  mutation createWebhook(
    $boardId: ID!
    $url: String!
    $event: WebhookEventType!
    $config: JSON
  ) {
    create_webhook(
      board_id: $boardId
      url: $url
      event: $event
      config: $config
    ) {
      id
      board_id
    }
  }`,
  deleteWebhook: `
  mutation deleteWebhook($webhookId: ID!) {
    delete_webhook(id: $webhookId) {
      id
      board_id
    }
  }`,
  createColumn: `
  mutation createColumn(
    $boardId: ID!
    $columnTitle: String!
    $columnType: ColumnType!
  ) {
    create_column(
      board_id: $boardId
      title: $columnTitle
      column_type: $columnType
    ) {
      id
    }
  }`,
  createGroup: `
  mutation createGroup($boardId: ID!, $groupName: String!) {
    create_group(board_id: $boardId, group_name: $groupName) {
      id
    }
  }`,
  createUpdate: `
  mutation createUpdate($itemId: ID!, $body: String!) {
    create_update(item_id: $itemId, body: $body) {
      id
    }
  }`,
};

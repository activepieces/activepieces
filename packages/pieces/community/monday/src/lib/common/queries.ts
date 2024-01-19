export const mondayGraphQLQueries = {
  listWorkspaces: `
    query listWorkspaces($limit: Int)
    {
        workspaces(limit: $limit)
        {
            id
            name
        }
    }`,
  listWorkspaceBoards: `
    query listWorkspaceBoards($workspaceId: ID)
    {
        boards(workspace_ids: [$workspaceId], order_by: created_at)
        {
            id
            name
            type
        }
    }`,
  listBoardGroups: `
    query listGroups($boardId: ID!)
    {
        boards(ids: [$boardId])
        {
            groups{
                id
                title
            }
        }
    }`,
  listBoardColumns: `
    query listBoardColumns($boardId: ID!)
    {
        boards(ids: [$boardId])
        {
            columns{
                id
                title
                type
                settings_str
                description
            }
        }
    }`,
  listBoardItems: `
    query listBoardItems($boardId: ID!)
    {
        boards(ids: [$boardId])
        {
            items_page
            {
                items{
                    id
                    name
                }
            }
        }
    }`,
  listUsers: `
    query listUsers
    {
        users(newest_first: true)
        {
            id
            name
            email
        }
    }`,
  getItemColumnValues: `
  query getItemColumnValues($boardId: ID!,$itemId: ID!,$columnIds: [String!])
  {
    boards(ids: [$boardId])
    {
      items_page(query_params: {ids: [$itemId]})
      {
        items{
          id
          name
          column_values(ids: $columnIds){
            id
            type
            value
            text
            ... on ButtonValue{
              label
            }
            ... on StatusValue{
              label
            }
            ... on VoteValue{
              vote_count
            }
            ... on TagsValue{
              tags{
                  name
              }
          }
          ... on BoardRelationValue {
            linked_item_ids
          }
          ... on DependencyValue {
            linked_item_ids
          }
          ... on WeekValue {
            start_date
            end_date
          }
          }
        }
      }
    }
  }`,
  getBoardItemValues: `
  query getItemColumnValues($boardId: ID!,$columnIds: [String!])
  {
    boards(ids: [$boardId])
    {
      items_page(query_params: {order_by: {column_id: "__last_updated__",direction: desc}})
      {
        items{
          id
          name
          column_values(ids: $columnIds){
            id
            type
            value
            text
            ... on ButtonValue{
              label
            }
            ... on StatusValue{
              label
            }
            ... on VoteValue{
              vote_count
            }
            ... on TagsValue{
              tags{
                  name
              }
          }
          ... on BoardRelationValue {
            linked_item_ids
          }
          ... on DependencyValue {
            linked_item_ids
          }
          ... on WeekValue {
            start_date
            end_date
          }
          }
        }
      }
    }
  }`,
};

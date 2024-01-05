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
};

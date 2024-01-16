import { createAction } from "@activepieces/pieces-framework";
import { getAccessTokenOrThrow } from "@activepieces/pieces-common";
import { clickupCommon, listAllLists, listLists, listSpaces, listTasks } from "../../common";
import { clickupAuth } from "../../../";

export const getClickupTasks = createAction({
  auth: clickupAuth,
  name: 'get_list_tasks',
  description: 'Gets a list of task from a list',
  displayName: 'Get Tasks',
  props: {
    workspace_id: clickupCommon.workspace_id(true),
    space_id: clickupCommon.space_id(false),
    folder_id: clickupCommon.folder_id(false),
    list_id: clickupCommon.list_id(false),
  },
  async run(configValue) {
    const { list_id, folder_id, space_id, workspace_id } = configValue.propsValue;
    const auth = getAccessTokenOrThrow(configValue.auth)

    if (list_id) {
      return (await listTasks(auth, list_id as unknown as string)).tasks
    }

    if (folder_id) {
      let tasks: { id: string; name: string; }[] = []
      
      const lists = (await listLists(auth, folder_id as unknown as string)).lists
      for (let k = 0; k < lists.length; k++) {
        tasks = [...tasks, ...(await listTasks(auth, lists[k].id)).tasks]
      }
      return tasks
    }

    if (space_id) {
      let tasks: { id: string; name: string; }[] = []
      
      const lists = await listAllLists(auth, space_id)
      for (let k = 0; k < lists.length; k++) {
        tasks = [...tasks, ...(await listTasks(auth, lists[k].id)).tasks]
      }
      
      return tasks
    }

    if (workspace_id) {
      const spaces = (await listSpaces(auth, workspace_id)).spaces
      let tasks: { id: string; name: string; }[] = []
      for (let i = 0; i < spaces.length; i++) {
        const lists = await listAllLists(auth, spaces[i].id)
        for (let k = 0; k < lists.length; k++) {
          tasks = [...tasks, ...(await listTasks(auth, lists[k].id)).tasks]
        }
      }
      return tasks
    }

    return []
  }
})
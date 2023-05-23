import { createAction, Property } from "@activepieces/pieces-framework";
import { asanaCommon, callAsanaApi, getTags } from "../common";
import { getAccessTokenOrThrow, HttpMethod } from "@activepieces/pieces-common";
import dayjs from "dayjs";

export const createAsanaTask = createAction({
    name: 'create_task',
    description: 'Create a new task',
    displayName: 'Create Task',
    props: {
        authentication: asanaCommon.authentication,
        workspace: asanaCommon.workspace,
        project: asanaCommon.project,
        name: Property.ShortText({
            description: 'The name of the task to create',
            displayName: 'Task Name',
            required: true,
        }),
        notes: Property.LongText({
            description: 'Free-form textual information associated with the task (i.e. its description).',
            displayName: 'Task Description',
            required: true,
        }),
        due_on: Property.ShortText({
            description: 'The date on which this task is due in any format.',
            displayName: 'Due Date',
            required: false,
        }),
        tags: asanaCommon.tags,
    },
    sampleData: {

        "gid": "1203851701808347",
        "resource_type": "task",
        "created_at": "2023-01-29T17:42:13.598Z",
        "modified_at": "2023-01-29T17:42:13.759Z",
        "name": "First Task",
        "notes": "Heloo Hello",
        "assignee": null,
        "completed": false,
        "assignee_status": "upcoming",
        "completed_at": null,
        "due_on": null,
        "due_at": null,
        "resource_subtype": "default_task",
        "tags": [],
        "projects": [
            {
                "gid": "1203851606424941",
                "resource_type": "project",
                "name": "Cross-functional project plan"
            }
        ],
        "workspace": {
            "gid": "1202550105911307",
            "resource_type": "workspace",
            "name": "activepieces.com"
        }
    },
    async run(configValue) {
        const { project, name, notes, authentication, tags, workspace, due_on } = configValue.propsValue;

        const convertDueOne =  due_on ? dayjs(due_on).toISOString() : undefined;

        // User can provide tags name as dynamic value, we need to convert them to tags gids
        const userTags = tags ?? [];
        const convertedTags = await getTags(authentication.access_token, workspace);
        const tagsGids = userTags.map((tag) => {
            const foundTagById = convertedTags.find((convertedTag) => convertedTag.gid === tag);
            if (foundTagById) {
                return foundTagById.gid;
            }
            const foundTag = convertedTags.find((convertedTag) => convertedTag.name?.toLowerCase() === tag.toLowerCase());
            if (foundTag) {
                return foundTag.gid;
            }
            return null;
        }).filter((tag) => tag !== null);

        return (await callAsanaApi(HttpMethod.POST,
            `tasks`, getAccessTokenOrThrow(authentication), {
            data: {
                name,
                projects: [project],
                notes,
                due_on: convertDueOne,
                tags: tagsGids
            }
        })).body['data'];
    },
});



import { createAction } from '../../../framework/action/action';
import { HttpMethod } from '../../../common/http/core/http-method';
import { Property } from '../../../framework/property';
import { asanaCommon, callAsanaApi } from '../common';
import { getAccessTokenOrThrow } from '../../../common/helpers';

export const createAsanaTask = createAction({
    name: 'create_task',
    description: 'Create a new task in a ClickUp workspace and list',
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
        const { project, name, notes, authentication } = configValue.propsValue;
        return (await callAsanaApi(HttpMethod.POST,
            `tasks`, getAccessTokenOrThrow(authentication), {
            data: {
                name,
                projects: [project],
                notes
            }
        })).body['data'];
    },
});
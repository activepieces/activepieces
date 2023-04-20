import { createAction, Property} from "@activepieces/pieces-framework";
import {  HttpMethod, getAccessTokenOrThrow } from "@activepieces/pieces-common";

import { clickupCommon, callClickUpApi } from "../../common";


export const createClickupTask = createAction({
	name: 'create_task',
	description: 'Create a new task in a ClickUp workspace and list',
	displayName: 'Create Task',
	props: {
		authentication: clickupCommon.authentication,
		workspace_id: clickupCommon.workspace_id(),
		space_id: clickupCommon.space_id(),
		list_id: clickupCommon.list_id(),
		name: Property.ShortText({
			description: 'The name of the task to create',
			displayName: 'Task Name',
			required: true,
		}),
		description: Property.LongText({
			description: 'The description of the task to create',
			displayName: 'Task Description',
			required: true,
		}),
	},
	sampleData: {
		"id": "8669nk0qm",
		"custom_id": null,
		"name": "Sample",
		"text_content": "Decide",
		"description": "Decide",
		"status": {
			"id": "subcat900900799744_subcat240030938_subcat200681950_subcat200681568_subcat182410664_subcat204198393_subcat158517499_sc162726644_bmR4Bbqu",
			"status": "to do",
			"color": "#d3d3d3",
			"orderindex": 0,
			"type": "open"
		},
		"orderindex": "39714023.00000000000000000000000000000000",
		"date_created": "1677844625424",
		"date_updated": "1677844625424",
		"date_closed": null,
		"date_done": null,
		"archived": false,
		"creator": {
			"id": 72061677,
			"username": "John Smith",
			"color": "#ff5722",
			"email": "jsmith@email.com",
			"profilePicture": null
		},
		"assignees": [],
		"watchers": [
			{
				"id": 72061677,
				"username": "John Smith",
				"color": "#ff5722",
				"initials": "JS",
				"email": "jsmith@email.com",
				"profilePicture": null
			}
		],
		"checklists": [],
		"tags": [],
		"parent": null,
		"priority": null,
		"due_date": null,
		"start_date": null,
		"points": null,
		"time_estimate": null,
		"time_spent": 0,
		"custom_fields": [
			{
				"id": "48e93d69-77c7-4e34-8bce-16c850af422c",
				"name": "FUN",
				"type": "drop_down",
				"type_config": {
					"default": 0,
					"placeholder": null,
					"new_drop_down": true,
					"options": [
						{
							"id": "e73d151b-4579-4385-bbf5-52f59dabb548",
							"name": "HIGH",
							"color": "#2ecd6f",
							"orderindex": 0
						},
						{
							"id": "97d34de4-4d7b-4507-be3b-273b39d6f4a0",
							"name": "MEDIUM",
							"color": "#f9d900",
							"orderindex": 1
						},
						{
							"id": "26467bf7-c1c5-4a77-8aec-422104f850c1",
							"name": "LOW",
							"color": "#E65100",
							"orderindex": 2
						}
					]
				},
				"date_created": "1677838744775",
				"hide_from_guests": false,
				"required": null
			}
		],
		"dependencies": [],
		"linked_tasks": [],
		"team_id": "9009080533",
		"url": "https://app.clickup.com/t/8669nk0qm",
		"sharing": {
			"public": false,
			"public_share_expires_on": null,
			"public_fields": [
				"assignees",
				"priority",
				"due_date",
				"content",
				"comments",
				"attachments",
				"customFields",
				"subtasks",
				"tags",
				"checklists",
				"coverimage"
			],
			"token": null,
			"seo_optimized": false
		},
		"permission_level": "create",
		"list": {
			"id": "900900799744",
			"name": "List",
			"access": true
		},
		"project": {
			"id": "90090446143",
			"name": "hidden",
			"hidden": true,
			"access": true
		},
		"folder": {
			"id": "90090446143",
			"name": "hidden",
			"hidden": true,
			"access": true
		},
		"space": {
			"id": "90090160321"
		}
	},
	async run(configValue) {
		const { list_id, name, description, authentication } = configValue.propsValue;
		const response = await callClickUpApi(HttpMethod.POST,
			`list/${list_id}/task`, getAccessTokenOrThrow(authentication), {
			name,
			description
		});

		return response.body;
	},
});

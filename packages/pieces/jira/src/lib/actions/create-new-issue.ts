import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { jiraCommon } from "../common";

export const createNewIssue = createAction({
	name: 'create_new_issue',
  displayName:'Create New Issue',
  description: 'Creates a new issue',
	props: {
		authentication: jiraCommon.authentication,
    site_id: jiraCommon.site_id(),
    project_id: jiraCommon.project_id()
	},
	async run(context) {
    return {}
	},
});

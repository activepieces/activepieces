import { createAction, Property } from "@activepieces/pieces-framework";
import { jiraCommon, buildClient } from "../common";

export default createAction({
  name: 'create_new_issue',
  displayName:'Create New Issue',
  description: 'Creates a new issue',
  props: {
    authentication: jiraCommon.authentication,
    site_id: jiraCommon.site_id(),
    project_id: jiraCommon.project_id(),
    issue_type: jiraCommon.issue_type(),
    summary: Property.ShortText({
      description: 'Summary of the issue',
      displayName: 'Summary',
      required: true
    }),
    description: Property.LongText({
      description: 'Description of the issue',
      displayName: 'Description',
      required: false
    }),
    fields: Property.Object({
      displayName: 'Additional Fields',
      required: false
    })
  },
  async run(context) {
    const client = buildClient(context.propsValue)
    try {
      const issue = await client.issues.createIssue({
        fields: {
          ...context.propsValue.fields,
          issuetype: {
            name: context.propsValue.issue_type
          },
          summary: context.propsValue.summary,
          description: context.propsValue.description || undefined,
          project: {
            id: context.propsValue.project_id
          }
        }
      })
      return issue
    } catch (e: any) {
      throw e.response.data
    }
  }
})

import { createJiraWebhookTrigger } from "./helper";

export default createJiraWebhookTrigger('jira:issue_updated', 'issue_updated', 'Issue Updated', 'Executes when an existing issue is updated')
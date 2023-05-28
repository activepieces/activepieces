import { createJiraWebhookTrigger } from "./helper";

export default createJiraWebhookTrigger('jira:issue_created', 'issue_created', 'Issue Created', 'Executes when a new issue is created')
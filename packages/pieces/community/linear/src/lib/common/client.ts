import { LinearClient, LinearDocument } from '@linear/sdk';

export class LinearClientWrapper {
  private client: LinearClient;
  constructor(config: { apiKey?: string; accessToken?: string }) {
    if (config.accessToken) {
      this.client = new LinearClient({ accessToken: config.accessToken });
    } else if (config.apiKey) {
      this.client = new LinearClient({ apiKey: config.apiKey });
    } else {
      throw new Error('Either apiKey or accessToken must be provided');
    }
  }
  async createIssue(input: LinearDocument.IssueCreateInput) {
    return this.client.createIssue(input);
  }
  async listIssueStates(
    variables: LinearDocument.WorkflowStatesQueryVariables
  ) {
    return this.client.workflowStates(variables);
  }
  async listIssuePriorities() {
    return this.client.issuePriorityValues;
  }
  async listUsers(variables: LinearDocument.UsersQueryVariables) {
    return this.client.users(variables);
  }
  async listIssueLabels(variables: LinearDocument.IssueLabelsQueryVariables) {
    return this.client.issueLabels(variables);
  }
  async listTeams(variables: LinearDocument.TeamsQueryVariables = {}) {
    return this.client.teams(variables);
  }
  async listIssues(variables: LinearDocument.IssuesQueryVariables = {}) {
    return this.client.issues(variables);
  }
  async updateIssue(issueId: string, input: LinearDocument.IssueUpdateInput) {
    return this.client.updateIssue(issueId, input);
  }
  async createProject(input: LinearDocument.ProjectCreateInput) {
    return this.client.createProject(input);
  }
  async listProjects(variables: LinearDocument.ProjectsQueryVariables = {}) {
    return this.client.projects(variables);
  }
  async updateProject(
    projectId: string,
    input: LinearDocument.ProjectUpdateInput
  ) {
    return this.client.updateProject(projectId, input);
  }
  async createComment(input: LinearDocument.CommentCreateInput) {
    return this.client.createComment(input);
  }
  async createWebhook(input: LinearDocument.WebhookCreateInput) {
    return this.client.createWebhook(input);
  }
  async listWebhooks(variables: LinearDocument.WebhooksQueryVariables = {}) {
    return this.client.webhooks(variables);
  }
  async deleteWebhook(webhookId: string) {
    return this.client.deleteWebhook(webhookId);
  }
  async listTeamsTemplates(
    teamId: string,
    variables: Omit<LinearDocument.Team_TemplatesQueryVariables, 'id'>
  ) {
    const team = await this.client.team(teamId);
    return team.templates(variables);
  }
  async rawRequest(query: string, variables?: Record<string, unknown>) {
    return this.client.client.rawRequest(query, variables);
  }
}

export function makeClient(
  auth: { access_token: string } | { secret_text: string }
): LinearClientWrapper {
  if ('access_token' in auth) {
    return new LinearClientWrapper({ accessToken: auth.access_token });
  }
  return new LinearClientWrapper({ apiKey: auth.secret_text });
}

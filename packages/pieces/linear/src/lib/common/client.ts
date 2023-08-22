import { LinearClient, LinearDocument } from '@linear/sdk';

export class LinearClientWrapper {
  private client: LinearClient;
  constructor(apiKey: string) {
    this.client = new LinearClient({ apiKey: apiKey });
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
  async listUsers() {
    return this.client.users();
  }
  async listIssueLabels() {
    return this.client.issueLabels();
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
}

export function makeClient(apiKey: string): LinearClientWrapper {
  return new LinearClientWrapper(apiKey);
}

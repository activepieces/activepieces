import { LinearClient } from '@linear/sdk';
import {
  createIssuePayload,
  listTeamsQueryVariables,
  listWorkflowStatesQueryVariables,
  listIssuesQueryVaribles,
  updateIssuePayload,
} from './models';
export class LinearClientWrapper {
  private client: LinearClient;
  constructor(apiKey: string) {
    this.client = new LinearClient({ apiKey: apiKey });
  }
  async createIssue(input: createIssuePayload) {
    return this.client.createIssue(input);
  }
  async listIssueStates(variables: listWorkflowStatesQueryVariables) {
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
  async listTeams(variables: listTeamsQueryVariables = {}) {
    return this.client.teams(variables);
  }
  async listIssues(variables: listIssuesQueryVaribles = {}) {
    return this.client.issues(variables);
  }
  async updateIssue(issueId: string, input: updateIssuePayload) {
    return this.client.updateIssue(issueId, input);
  }
}

export function makeClient(apiKey: string): LinearClientWrapper {
  return new LinearClientWrapper(apiKey);
}

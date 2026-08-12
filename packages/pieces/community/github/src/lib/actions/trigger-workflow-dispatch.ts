import {
  createAction,
  DynamicPropsValue,
  ExecutionType,
  Property,
  StoreScope,
} from '@activepieces/pieces-framework';
import * as YAML from 'yaml';
import { githubAuth } from '../auth';
import {
  getRepoEnvironments,
  getRepoFileContent,
  getWorkflowRun,
  githubApiCall,
  githubCommon,
  RepositoryProp,
} from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { GithubAuthValue } from '../common/auth-helpers';

const WORKFLOW_DISPATCH_NOTE = `**Requirements**

- The selected workflow file must declare an \`on: workflow_dispatch\` trigger on the chosen branch/tag, or triggering it will fail.
- Your GitHub connection needs these permissions on the target repo:
  - **Actions** — Read and write
  - **Contents** — Read-only
- If you're connected via OAuth2 with the \`repo\` scope, this is already covered.`;

export const githubTriggerWorkflowDispatchAction = createAction({
  auth: githubAuth,
  name: 'trigger_workflow_dispatch',
  displayName: 'Trigger Workflow Dispatch',
  description:
    'Manually triggers a GitHub Actions workflow run via the workflow_dispatch event.',
  audience: 'both',
  aiMetadata: {
    description:
      "Triggers a GitHub Actions workflow run on a given branch/tag, optionally passing inputs. The target workflow's YAML must declare an `on: workflow_dispatch` trigger, or the call fails. Not idempotent: every call starts a new, separate workflow run.",
    idempotent: false,
  },
  props: {
    workflowDispatchNote: Property.MarkDown({
      value: WORKFLOW_DISPATCH_NOTE,
    }),
    repository: githubCommon.repositoryDropdown,
    workflow: githubCommon.workflowDropdown({
      description:
        'The workflow to trigger. It must have a workflow_dispatch trigger configured in its YAML file.',
      required: true,
    }),
    ref: githubCommon.refDropdown({
      description:
        'The branch or tag to run the workflow on. If a branch and a tag share the same name, GitHub resolves the tag.',
      required: true,
    }),
    inputs: Property.DynamicProperties({
      auth: githubAuth,
      displayName: 'Workflow Inputs',
      description:
        'Detected from the workflow_dispatch trigger declared in the workflow file, as it exists on the selected branch/tag.',
      required: false,
      refreshers: ['repository', 'workflow', 'ref'],
      props: async ({
        auth,
        repository,
        workflow,
        ref,
      }): Promise<DynamicPropsValue> => {
        if (!auth || !repository || !workflow || !ref) {
          return {};
        }
        const { owner, repo } = repository as RepositoryProp;
        const { path } = workflow as { id: number; path: string };

        const trigger = await getWorkflowDispatchTrigger(
          auth as GithubAuthValue,
          owner,
          repo,
          path,
          ref as string
        );

        if (!trigger.present) {
          return {};
        }

        const fields: DynamicPropsValue = {};
        for (const [key, def] of Object.entries(trigger.inputs)) {
          fields[key] = await buildInputProperty(
            key,
            def,
            auth as GithubAuthValue,
            owner,
            repo
          );
        }
        return fields;
      },
    }),
    waitForCompletion: Property.Checkbox({
      displayName: 'Wait for Completion',
      description:
        'Pause this flow and poll the triggered run until it finishes (or times out), instead of returning immediately after dispatching it.',
      required: true,
      defaultValue: false,
    }),
    waitSettings: Property.DynamicProperties({
      auth: githubAuth,
      displayName: 'Wait Settings',
      description: 'Only used when "Wait for Completion" is enabled.',
      required: false,
      refreshers: ['waitForCompletion'],
      props: async ({ waitForCompletion }): Promise<DynamicPropsValue> => {
        if (!waitForCompletion) {
          return {};
        }
        return {
          pollIntervalInSeconds: Property.ShortText({
            displayName: 'Poll Interval (seconds)',
            description: "How often to check the run's status while waiting.",
            required: false,
            defaultValue: '60',
          }),
          timeoutInMinutes: Property.ShortText({
            displayName: 'Wait Timeout (minutes)',
            description:
              'Give up waiting after this many minutes and throw an error (the workflow run itself keeps going on GitHub either way).',
            required: false,
            defaultValue: '30',
          }),
        };
      },
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { owner, repo } = propsValue.repository!;
    const workflow = propsValue.workflow as { id: number; path: string };
    const waitSettings = propsValue.waitSettings ?? {};
    const waitStateKey = `github_trigger_workflow_dispatch_wait_${context.run.id}`;

    if (context.executionType === ExecutionType.RESUME) {
      const state = await context.store.get<WaitState>(
        waitStateKey,
        StoreScope.FLOW
      );
      if (!state) {
        throw new Error(
          'Lost track of the dispatched workflow run while resuming — no wait state found for this execution.'
        );
      }

      const runStatus = await getWorkflowRun(auth, owner, repo, state.runId);

      if (runStatus.status === 'completed') {
        await context.store.delete(waitStateKey, StoreScope.FLOW);
        return runStatus;
      }

      if (Date.now() >= state.deadline) {
        await context.store.delete(waitStateKey, StoreScope.FLOW);
        throw new Error(
          `Timed out waiting for workflow run ${state.runId} to finish (last status: "${runStatus.status}"). The run itself keeps going on GitHub: ${runStatus.html_url}`
        );
      }

      const resumeAt = new Date(
        Date.now() +
          parseWaitSetting(waitSettings, 'pollIntervalInSeconds', 60) * 1000
      );
      const nextPoll = await context.run.createWaitpoint({
        type: 'DELAY',
        resumeDateTime: resumeAt.toUTCString(),
      });
      context.run.waitForWaitpoint(nextPoll.id);
      return runStatus;
    }

    const { ref } = propsValue;
    const inputs = propsValue.inputs ?? {};

    const dispatchResponse = await githubApiCall<{ workflow_run_id: number }>({
      auth,
      method: HttpMethod.POST,
      resourceUri: `/repos/${owner}/${repo}/actions/workflows/${workflow.id}/dispatches`,
      body: {
        ref,
        ...(inputs && Object.keys(inputs).length > 0 ? { inputs } : {}),
        return_run_details: true,
      },
    });

    const initialRun = await getWorkflowRun(
      auth,
      owner,
      repo,
      dispatchResponse.body.workflow_run_id
    );

    if (!propsValue.waitForCompletion) {
      return initialRun;
    }

    const timeoutMinutes = parseWaitSetting(
      waitSettings,
      'timeoutInMinutes',
      30
    );
    const state: WaitState = {
      runId: initialRun.id,
      deadline: Date.now() + timeoutMinutes * 60 * 1000,
    };
    await context.store.put(waitStateKey, state, StoreScope.FLOW);

    const resumeAt = new Date(
      Date.now() +
        parseWaitSetting(waitSettings, 'pollIntervalInSeconds', 60) * 1000
    );
    const firstPoll = await context.run.createWaitpoint({
      type: 'DELAY',
      resumeDateTime: resumeAt.toUTCString(),
    });
    context.run.waitForWaitpoint(firstPoll.id);
    return initialRun;
  },
});

type WaitState = {
  runId: number;
  deadline: number;
};

function parseWaitSetting(
  waitSettings: DynamicPropsValue,
  key: string,
  fallback: number
): number {
  const raw = waitSettings[key];
  if (typeof raw !== 'string' || raw.trim() === '') {
    return fallback;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function getWorkflowDispatchTrigger(
  auth: GithubAuthValue,
  owner: string,
  repo: string,
  path: string,
  ref: string
): Promise<WorkflowDispatchTrigger> {
  const yamlText = await getRepoFileContent(auth, owner, repo, path, ref);
  const parsed = YAML.parse(yamlText);
  return parseWorkflowDispatchTrigger(parsed);
}

export function parseWorkflowDispatchTrigger(
  parsed: unknown
): WorkflowDispatchTrigger {
  if (!parsed || typeof parsed !== 'object') {
    return { present: false, inputs: {} };
  }
  const onValue = (parsed as Record<string, unknown>)['on'];

  if (typeof onValue === 'string') {
    return { present: onValue === 'workflow_dispatch', inputs: {} };
  }
  if (Array.isArray(onValue)) {
    return { present: onValue.includes('workflow_dispatch'), inputs: {} };
  }
  if (
    !onValue ||
    typeof onValue !== 'object' ||
    !('workflow_dispatch' in onValue)
  ) {
    return { present: false, inputs: {} };
  }

  const workflowDispatch = (onValue as Record<string, unknown>)[
    'workflow_dispatch'
  ] as { inputs?: Record<string, WorkflowDispatchInputDef> } | null;

  return {
    present: true,
    inputs: workflowDispatch?.inputs ?? {},
  };
}

async function buildInputProperty(
  key: string,
  def: WorkflowDispatchInputDef,
  auth: GithubAuthValue,
  owner: string,
  repo: string
) {
  const displayName = `[Workflow Input]: ${key}`;
  const description = buildInputDescription(def);
  const required = def.required ?? false;
  const defaultValue =
    def.default !== undefined ? String(def.default) : undefined;

  switch (def.type) {
    case 'boolean':
      return Property.StaticDropdown({
        displayName,
        description,
        required,
        defaultValue,
        options: {
          options: [
            { label: 'True', value: 'true' },
            { label: 'False', value: 'false' },
          ],
        },
      });
    case 'choice':
      return Property.StaticDropdown({
        displayName,
        description,
        required,
        defaultValue,
        options: {
          options: (def.options ?? []).map((option) => ({
            label: option,
            value: option,
          })),
        },
      });
    case 'environment': {
      const environments = await getRepoEnvironments(auth, owner, repo);
      if (environments.length === 0) {
        return Property.ShortText({
          displayName,
          description,
          required,
          defaultValue,
        });
      }
      return Property.StaticDropdown({
        displayName,
        description,
        required,
        defaultValue,
        options: {
          options: environments.map((environment) => ({
            label: environment.name,
            value: environment.name,
          })),
        },
      });
    }
    case 'string':
    default:
      return Property.ShortText({
        displayName,
        description,
        required,
        defaultValue,
      });
  }
}

function buildInputDescription(def: WorkflowDispatchInputDef): string {
  const typePrefix = `[${def.type ?? 'string'}]`;
  return def.description ? `${typePrefix} ${def.description}` : typePrefix;
}

type WorkflowDispatchInputDef = {
  description?: string;
  required?: boolean;
  default?: string | number | boolean;
  type?: 'string' | 'boolean' | 'choice' | 'environment';
  options?: string[];
};

type WorkflowDispatchTrigger = {
  present: boolean;
  inputs: Record<string, WorkflowDispatchInputDef>;
};

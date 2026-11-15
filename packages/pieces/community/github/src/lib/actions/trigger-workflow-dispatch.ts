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

const WORKFLOW_DISPATCH_NOTE = `The workflow must have an \`on: workflow_dispatch\` trigger on the chosen branch or tag. The connection needs **Actions** read and write and **Contents** read access; OAuth's \`repo\` scope covers both.`;

export const githubTriggerWorkflowDispatchAction = createAction({
  auth: githubAuth,
  name: 'trigger_workflow_dispatch',
  classification: 'WRITE',
  displayName: 'Trigger Workflow Dispatch',
  description:
    'Starts a GitHub Actions workflow run, optionally waiting for it.',
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
      description: 'Only workflows with a workflow_dispatch trigger can run.',
      required: true,
    }),
    ref: githubCommon.refDropdown({
      description: 'If a branch and a tag share a name, GitHub uses the tag.',
      required: true,
    }),
    inputs: Property.DynamicProperties({
      auth: githubAuth,
      displayName: 'Workflow Inputs',
      description: 'Read from the workflow file on the chosen branch or tag.',
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
        'Pause the flow until the run finishes or the timeout passes.',
      required: false,
      defaultValue: false,
    }),
    waitSettings: Property.DynamicProperties({
      auth: githubAuth,
      displayName: 'Wait Settings',
      description: 'Used only when Wait for Completion is on.',
      required: false,
      refreshers: ['waitForCompletion'],
      props: async ({ waitForCompletion }): Promise<DynamicPropsValue> => {
        if (!waitForCompletion) {
          return {};
        }
        return {
          pollIntervalInSeconds: Property.ShortText({
            displayName: 'Poll Interval',
            description: 'Seconds between status checks.',
            required: false,
            defaultValue: '60',
          }),
          timeoutInMinutes: Property.ShortText({
            displayName: 'Wait Timeout',
            description:
              'Minutes before the step fails. The run keeps going on GitHub.',
            required: false,
            defaultValue: '30',
          }),
        };
      },
    }),
  },
  propertyGroups: [
    {
      key: 'workflow',
      display: 'section',
      label: 'Workflow',
      icon: 'send',
      props: [
        'workflowDispatchNote',
        'repository',
        'workflow',
        'ref',
        'inputs',
      ],
    },
    {
      key: 'run',
      display: 'section',
      label: 'Run',
      icon: 'sliders',
      props: ['waitForCompletion', 'waitSettings'],
    },
  ],
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
  const displayName = key;
  const description = def.description;
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

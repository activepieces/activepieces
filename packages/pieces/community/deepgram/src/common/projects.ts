import { HttpMethod } from '@activepieces/pieces-common';
import { DEEPGRAM_TIMEOUTS, deepgramClient } from './client';

async function listProjects({
  apiKey,
}: {
  apiKey: string;
}): Promise<DeepgramProject[]> {
  const response = await deepgramClient.request<ProjectsResponse>({
    apiKey,
    method: HttpMethod.GET,
    path: '/projects',
    timeoutMs: DEEPGRAM_TIMEOUTS.manage,
    operation: 'list projects',
  });
  return response.body?.projects ?? [];
}

async function resolveProjectId({
  apiKey,
  project,
}: {
  apiKey: string;
  project: string | undefined | null;
}): Promise<string> {
  const chosen = typeof project === 'string' ? project.trim() : '';
  if (chosen.length > 0) {
    return chosen;
  }
  const projects = await listProjects({ apiKey });
  if (projects.length === 1) {
    return projects[0].project_id;
  }
  if (projects.length === 0) {
    throw new Error(
      'This Deepgram API key has no projects. Create a project in the Deepgram Console or use a key from another project.'
    );
  }
  const shown = projects
    .slice(0, 10)
    .map((item) => `${item.name} (${item.project_id})`)
    .join(', ');
  const more = projects.length > 10 ? ` and ${projects.length - 10} more` : '';
  throw new Error(
    `This API key can access ${projects.length} Deepgram projects. Choose one in the Project field: ${shown}${more}.`
  );
}

function projectPath({
  projectId,
  rest,
}: {
  projectId: string;
  rest?: string[];
}): string {
  const tail = (rest ?? [])
    .map((segment) => `/${encodeURIComponent(segment)}`)
    .join('');
  return `/projects/${encodeURIComponent(projectId)}${tail}`;
}

async function getProject({
  apiKey,
  projectId,
}: {
  apiKey: string;
  projectId: string;
}): Promise<FlatProject> {
  const response = await deepgramClient.request<ProjectResponse>({
    apiKey,
    method: HttpMethod.GET,
    path: projectPath({ projectId }),
    timeoutMs: DEEPGRAM_TIMEOUTS.manage,
    operation: 'get the project',
  });
  const body = response.body ?? {};
  return {
    project_id: body.project_id ?? projectId,
    name: body.name ?? null,
    mip_opt_out:
      typeof body.mip_opt_out === 'boolean' ? body.mip_opt_out : null,
  };
}

export const deepgramProjects = {
  listProjects,
  resolveProjectId,
  projectPath,
  getProject,
};

type ProjectResponse = {
  project_id?: string;
  name?: string;
  mip_opt_out?: boolean;
};

type FlatProject = {
  project_id: string;
  name: string | null;
  mip_opt_out: boolean | null;
};

type ProjectsResponse = {
  projects?: DeepgramProject[];
};

export type DeepgramProject = {
  project_id: string;
  name: string;
};

import { Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../auth';
import { GitlabAuthValue, gitlabListPage } from './client';
import { GitlabProjectSummary } from './models';

export async function listProjectOptions({
  auth,
  searchValue,
}: {
  auth: GitlabAuthValue;
  searchValue?: string;
}): Promise<{
  options: { label: string; value: number }[];
  truncated: boolean;
}> {
  const options: { label: string; value: number }[] = [];
  const search = searchValue?.trim();
  let page: number | null = 1;
  let fetched = 0;
  while (page !== null && fetched < PROJECT_DROPDOWN_PAGE_CAP) {
    const result: Awaited<
      ReturnType<typeof gitlabListPage<GitlabProjectSummary>>
    > = await gitlabListPage<GitlabProjectSummary>({
      auth,
      path: '/projects',
      query: {
        simple: true,
        membership: true,
        order_by: 'last_activity_at',
        search: search || undefined,
      },
      page,
      perPage: 100,
    });
    for (const project of result.items) {
      options.push({
        label: project.name_with_namespace ?? project.name,
        value: project.id,
      });
    }
    fetched += 1;
    page = result.nextPage;
  }
  return { options, truncated: page !== null };
}

export const PROJECT_DROPDOWN_PAGE_CAP = 10;

export const gitlabCommon = {
  projectId: (required = true) =>
    Property.Dropdown({
      auth: gitlabAuth,
      displayName: 'Project',
      required,
      refreshers: [],
      refreshOnSearch: true,
      options: async ({ auth }, { searchValue }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Setup authentication first',
            options: [],
          };
        }
        try {
          const { options, truncated } = await listProjectOptions({
            auth,
            searchValue,
          });
          return {
            disabled: false,
            options,
            placeholder: truncated
              ? 'Showing your most recently active projects. Type to search for others.'
              : undefined,
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: `Could not load projects: ${
              error instanceof Error ? error.message : String(error)
            }`,
            options: [],
          };
        }
      },
    }),
};

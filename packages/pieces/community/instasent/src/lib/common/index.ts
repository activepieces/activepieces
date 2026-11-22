import { BASE_URL } from './constants';

function getBaseUrl({ projectId, datasourceId }: { projectId: string; datasourceId: string }): string {
    return `${BASE_URL}/project/${projectId}/datasource/${datasourceId}`;
}

export const instasentCommon = { getBaseUrl };

import { googleContactsApi } from './index';

function summarizeGroup({ group }: { group: unknown }): Record<string, unknown> {
  const memberCount = googleContactsApi.readValue({
    source: group,
    path: ['memberCount'],
  });
  return {
    resourceName: googleContactsApi.readString({
      source: group,
      path: ['resourceName'],
    }),
    etag: googleContactsApi.readString({ source: group, path: ['etag'] }),
    name: googleContactsApi.readString({ source: group, path: ['name'] }),
    formattedName: googleContactsApi.readString({
      source: group,
      path: ['formattedName'],
    }),
    groupType: googleContactsApi.readString({ source: group, path: ['groupType'] }),
    memberCount: typeof memberCount === 'number' ? memberCount : 0,
    memberResourceNames: googleContactsApi
      .readArray({ source: group, path: ['memberResourceNames'] })
      .filter((value): value is string => typeof value === 'string'),
  };
}

function matchesName({ group, name }: { group: unknown; name: string }): boolean {
  const target = name.trim().toLowerCase();
  const groupName = googleContactsApi.readString({ source: group, path: ['name'] });
  const formatted = googleContactsApi.readString({
    source: group,
    path: ['formattedName'],
  });
  return (
    groupName?.trim().toLowerCase() === target ||
    formatted?.trim().toLowerCase() === target
  );
}

export const googleContactsGroup = {
  summarizeGroup,
  matchesName,
};

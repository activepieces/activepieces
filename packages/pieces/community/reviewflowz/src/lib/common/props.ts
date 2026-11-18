import { HttpMethod } from '@activepieces/pieces-common';
import { DropdownOption, DropdownState, Property } from '@activepieces/pieces-framework';
import { reviewflowzAuth } from '../auth';
import { reviewflowzApi, ReviewflowzAuthValue } from './client';
import { reviewflowzFormat } from './format';
import { ReviewflowzCampaign } from './types';

function single<R extends boolean>({ list, displayName, description, required }: SingleParams<R>) {
  return Property.Dropdown<string, R, typeof reviewflowzAuth>({
    auth: reviewflowzAuth,
    displayName,
    description,
    required,
    refreshers: [],
    options: async ({ auth }) => optionsFor({ auth, list }),
  });
}

function multi({ list, displayName, description }: MultiParams) {
  return Property.MultiSelectDropdown({
    auth: reviewflowzAuth,
    displayName,
    description,
    required: false,
    refreshers: [],
    options: async ({ auth }) => optionsFor({ auth, list }),
  });
}

async function optionsFor({
  auth,
  list,
}: {
  auth: ReviewflowzAuthValue | undefined;
  list: OptionList;
}): Promise<DropdownState<string>> {
  if (!auth) {
    return { disabled: true, options: [], placeholder: 'Connect your Reviewflowz account first.' };
  }
  const options = await LISTS[list](auth);
  return {
    disabled: false,
    options,
    placeholder: options.length === 0 ? EMPTY[list] : undefined,
  };
}

async function rows<T>({ auth, path }: { auth: ReviewflowzAuthValue; path: string }): Promise<T[]> {
  return reviewflowzApi.listAll<T>({ auth, path, max: 1000 });
}

async function sourceOptions(auth: ReviewflowzAuthValue): Promise<DropdownOption<string>[]> {
  const sources = await rows<{ id: string; name?: string; url?: string; platform?: string }>({ auth, path: '/sources' });
  return sources.map((source) => ({
    label: `${source.name || source.url} · ${reviewflowzFormat.platformName(source.platform)}`,
    value: source.id,
  }));
}

async function locationOptions(auth: ReviewflowzAuthValue): Promise<DropdownOption<string>[]> {
  const locations = await rows<{ id: string; name: string }>({ auth, path: '/locations' });
  return locations.map((location) => ({ label: location.name, value: location.id }));
}

async function campaignOptions(auth: ReviewflowzAuthValue): Promise<DropdownOption<string>[]> {
  const campaigns = await rows<ReviewflowzCampaign>({ auth, path: '/campaigns' });
  return campaigns.map((campaign) => ({ label: reviewflowzFormat.campaignLabel(campaign), value: campaign.id }));
}

async function tagOptions(auth: ReviewflowzAuthValue): Promise<DropdownOption<string>[]> {
  const tags = await rows<{ id: string; name: string }>({ auth, path: '/tags' });
  return tags.map((tag) => ({ label: tag.name, value: tag.id }));
}

async function ownerOptions(auth: ReviewflowzAuthValue): Promise<DropdownOption<string>[]> {
  const owners = await rows<{ id: string; name: string; team?: string | null }>({ auth, path: '/owners' });
  return owners.map((owner) => ({ label: [owner.name, owner.team].filter(Boolean).join(' · '), value: owner.id }));
}

async function segmentOptions(auth: ReviewflowzAuthValue): Promise<DropdownOption<string>[]> {
  const segments = await rows<{ id: string; name: string; contact_count?: number }>({ auth, path: '/segments' });
  return segments.map((segment) => ({ label: `${segment.name} (${segment.contact_count ?? 0} contacts)`, value: segment.id }));
}

async function replyAgentOptions(auth: ReviewflowzAuthValue): Promise<DropdownOption<string>[]> {
  const agents = await rows<{ id: string; name: string; default?: boolean }>({ auth, path: '/reply-agents' });
  return agents.map((agent) => ({ label: agent.default ? `${agent.name} (default)` : agent.name, value: agent.id }));
}

async function dimensionOptions(auth: ReviewflowzAuthValue): Promise<DropdownOption<string>[]> {
  const dimensions = await rows<{ key: string; label?: string }>({ auth, path: '/dimensions' });
  return dimensions.map((dimension) => ({ label: dimension.label || dimension.key, value: dimension.key }));
}

async function platformOptions(auth: ReviewflowzAuthValue): Promise<DropdownOption<string>[]> {
  const page = await reviewflowzApi.call<{ data: { id: string; name: string }[] }>({
    auth,
    method: HttpMethod.GET,
    path: '/platforms',
  });
  return (page.data ?? []).map((platform) => ({ label: platform.name, value: platform.id }));
}

const LISTS: Record<OptionList, (auth: ReviewflowzAuthValue) => Promise<DropdownOption<string>[]>> = {
  sources: sourceOptions,
  locations: locationOptions,
  campaigns: campaignOptions,
  tags: tagOptions,
  owners: ownerOptions,
  segments: segmentOptions,
  replyAgents: replyAgentOptions,
  platforms: platformOptions,
  dimensions: dimensionOptions,
};

const EMPTY: Record<OptionList, string> = {
  sources: 'No sources yet. Add one in Reviewflowz.',
  locations: 'No locations yet. Add one in Reviewflowz.',
  campaigns: 'No campaigns yet. Create one in Reviewflowz or with the Create Campaign action.',
  tags: 'No tags yet.',
  owners: 'No team members yet.',
  segments: 'No segments yet.',
  replyAgents: 'No reply agents yet.',
  platforms: 'No platforms.',
  dimensions: 'No dimensions yet. Add one in Reviewflowz first.',
};

export const reviewflowzProps = {
  campaign: (description?: string) => single({ list: 'campaigns', displayName: 'Campaign', description, required: true }),
  optionalCampaign: (description?: string) =>
    single({ list: 'campaigns', displayName: 'Campaign', description, required: false }),
  campaigns: (description = 'Only these campaigns. Leave empty for all.') =>
    multi({ list: 'campaigns', displayName: 'Campaigns', description }),
  source: (description?: string) => single({ list: 'sources', displayName: 'Source', description, required: true }),
  optionalSource: (description?: string) =>
    single({ list: 'sources', displayName: 'Source', description, required: false }),
  sources: (description = 'Only these sources. Leave empty for all of them.') =>
    multi({ list: 'sources', displayName: 'Sources', description }),
  optionalLocation: (description?: string) =>
    single({ list: 'locations', displayName: 'Location', description, required: false }),
  locations: (description = 'Only sources at these locations. Leave empty for all.') =>
    multi({ list: 'locations', displayName: 'Locations', description }),
  platform: (description?: string) => single({ list: 'platforms', displayName: 'Platform', description, required: true }),
  optionalPlatform: (description?: string) =>
    single({ list: 'platforms', displayName: 'Platform', description, required: false }),
  platforms: (description = 'Only these platforms. Leave empty for all.') =>
    multi({ list: 'platforms', displayName: 'Platforms', description }),
  tag: (description?: string) => single({ list: 'tags', displayName: 'Tag', description, required: true }),
  tags: (description = 'Only when one of these tags is added or taken off. Leave empty for any tag.') =>
    multi({ list: 'tags', displayName: 'Tags', description }),
  owner: () => single({ list: 'owners', displayName: 'Team member', required: true }),
  owners: (description = 'Only these team members. Leave empty for anyone.') =>
    multi({ list: 'owners', displayName: 'Team members', description }),
  segment: () => single({ list: 'segments', displayName: 'Segment', required: true }),
  dimension: () =>
    single({
      list: 'dimensions',
      displayName: 'Dimension',
      description: 'One of your dimensions, like Region or Brand.',
      required: true,
    }),
  replyAgent: () =>
    single({
      list: 'replyAgents',
      displayName: 'Reply agent',
      description: 'Leave empty for your default agent.',
      required: false,
    }),
  reviewId: () =>
    Property.ShortText({
      displayName: 'Review ID',
      description:
        "The review's ID, like rev_918273: map it from a Reviewflowz trigger or the Find Review action.",
      required: true,
    }),
};

type OptionList =
  | 'sources'
  | 'locations'
  | 'campaigns'
  | 'tags'
  | 'owners'
  | 'segments'
  | 'replyAgents'
  | 'platforms'
  | 'dimensions';

type SingleParams<R extends boolean> = {
  list: OptionList;
  displayName: string;
  description?: string;
  required: R;
};

type MultiParams = {
  list: OptionList;
  displayName: string;
  description?: string;
};

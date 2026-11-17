import { HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/pieces-framework';
import { JsmAuthProps, jsmClient } from './client';

export const jsmTransitions = {
	list,
	find,
	resolutionsOf,
	findResolution,
	needsResolution,
	takesResolution,
};

async function list({ auth, requestKey }: { auth: JsmAuthProps; requestKey: string }): Promise<JiraTransition[]> {
	const response = await jsmClient.request<{ transitions?: JiraTransition[] }>({
		auth,
		api: 'jira',
		method: HttpMethod.GET,
		path: `/issue/${encodeURIComponent(requestKey.trim())}/transitions`,
		query: { expand: 'transitions.fields' },
	});
	return response.transitions ?? [];
}

function find({ transitions, idOrName }: { transitions: JiraTransition[]; idOrName: string }): JiraTransition | undefined {
	const wanted = idOrName.trim().toLowerCase();
	return (
		transitions.find((transition) => transition.id === wanted) ??
		transitions.find((transition) => (transition.name ?? '').toLowerCase() === wanted)
	);
}

function resolutionsOf(transition: JiraTransition | undefined): JiraResolution[] {
	return transition?.fields?.resolution?.allowedValues ?? [];
}

function findResolution({ transition, idOrName }: { transition: JiraTransition; idOrName: string }): JiraResolution | undefined {
	const wanted = idOrName.trim().toLowerCase();
	const resolutions = resolutionsOf(transition);
	return (
		resolutions.find((resolution) => resolution.id === wanted) ??
		resolutions.find((resolution) => (resolution.name ?? '').toLowerCase() === wanted)
	);
}

function needsResolution(transition: JiraTransition): boolean {
	return transition.fields?.resolution?.required === true;
}

function takesResolution(transition: JiraTransition): boolean {
	return !isNil(transition.fields?.resolution);
}

export type JiraTransition = {
	id: string;
	name?: string;
	to?: { name?: string };
	fields?: {
		resolution?: {
			required?: boolean;
			allowedValues?: JiraResolution[];
		};
	};
};

export type JiraResolution = {
	id: string;
	name?: string;
};

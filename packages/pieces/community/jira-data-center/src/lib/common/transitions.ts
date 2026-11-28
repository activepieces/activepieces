import { HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/pieces-framework';
import { JiraDataCenterAuth } from '../../auth';
import { jiraApiCall } from './index';

export const jiraTransitions = { list, find, resolutionsOf, resolutionChoices, resolve };

async function list({ auth, issueId }: { auth: JiraDataCenterAuth; issueId: string }): Promise<JiraTransition[]> {
	const response = await jiraApiCall<{ transitions?: JiraTransition[] }>({
		auth,
		method: HttpMethod.GET,
		resourceUri: `/issue/${encodeURIComponent(issueId)}/transitions`,
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

function resolutionChoices({
	transitions,
	transitionIdOrName,
}: {
	transitions: JiraTransition[];
	transitionIdOrName: string;
}): { disabled: boolean; options: Array<{ label: string; value: string }>; placeholder?: string } {
	const transition = find({ transitions, idOrName: transitionIdOrName });
	if (isNil(transition)) {
		return { disabled: true, options: [], placeholder: 'This transition is not available for the issue now' };
	}
	const resolutions = resolutionsOf(transition);
	if (resolutions.length === 0) {
		return { disabled: true, options: [], placeholder: 'This transition takes no resolution' };
	}
	return {
		disabled: false,
		options: resolutions.map((resolution) => ({ label: resolution.name ?? resolution.id, value: resolution.id })),
	};
}

function names(items: Array<{ id: string; name?: string }>): string {
	const listed = items.map((item) => item.name ?? item.id).join(', ');
	return listed.length > 0 ? listed : 'none';
}

function resolve({
	transitions,
	transitionIdOrName,
	resolutionIdOrName,
	issueId,
}: {
	transitions: JiraTransition[];
	transitionIdOrName: string;
	resolutionIdOrName: string | undefined;
	issueId: string;
}): { transition: JiraTransition; resolution: JiraResolution | undefined } {
	const transition = find({ transitions, idOrName: transitionIdOrName });
	if (isNil(transition)) {
		throw new Error(
			`Transition "${transitionIdOrName}" is not available for issue ${issueId} in its current status. Available now: ${names(transitions)}.`,
		);
	}
	const label = transition.name ?? transition.id;
	if (isNil(resolutionIdOrName)) {
		if (needsResolution(transition)) {
			throw new Error(
				`Transition "${label}" needs a resolution. Pick one in the Resolution field. Allowed: ${names(resolutionsOf(transition))}.`,
			);
		}
		return { transition, resolution: undefined };
	}
	if (!takesResolution(transition)) {
		return { transition, resolution: undefined };
	}
	const resolution = findResolution({ transition, idOrName: resolutionIdOrName });
	if (isNil(resolution)) {
		throw new Error(
			`Resolution "${resolutionIdOrName}" is not allowed for transition "${label}". Allowed: ${names(resolutionsOf(transition))}.`,
		);
	}
	return { transition, resolution };
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

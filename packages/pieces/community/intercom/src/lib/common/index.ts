import type { IntercomClient } from 'intercom-client';
import {
	getIntercomBaseUrl,
	getIntercomRegion,
	getIntercomToken,
	IntercomAuthValue,
	intercomSdkFetcher,
} from './client';
import { adminDropdown, contactDropdown } from './props';

export {
	getIntercomBaseUrl,
	getIntercomRegion,
	getIntercomToken,
	intercomRequest,
	IntercomApiError,
	INTERCOM_API_VERSION,
} from './client';
export type { IntercomAuthValue } from './client';

export const intercomClient = async (auth: IntercomAuthValue): Promise<IntercomClient> => {
	const { IntercomClient } = await import('intercom-client');
	return new IntercomClient({
		token: getIntercomToken(auth),
		environment: getIntercomBaseUrl(getIntercomRegion(auth)),
		fetcher: intercomSdkFetcher,
	});
};

export const commonProps = {
	admins: adminDropdown,
	contacts: contactDropdown,
};

export type Operator =
	| '='
	| '!='
	| 'IN'
	| 'NIN'
	| '<'
	| '>'
	| '~'
	| '!~'
	| '^'
	| '$';

export type TriggerPayload = {
	type: string;
	app_id: string;
	id: string;
	topic: string;
	data: {
		type: string;
		item: Record<string, unknown>;
	};
};

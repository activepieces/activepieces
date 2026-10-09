import { Runware } from '@runware/sdk-js';

import type { RunwareAuthValue } from './types';

function create({ auth }: { auth: RunwareAuthValue }) {
	return new Runware({ apiKey: auth.secret_text });
}

export const runwareClient = { create };

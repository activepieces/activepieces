import { Property } from '@activepieces/pieces-framework';
import type { DropdownState } from '@activepieces/pieces-framework';

import { googleDocumentAiAuth } from '../auth';
import { googleDocumentAiApi } from './api';

import type { GoogleDocumentAiAuthValue, GoogleDocumentAiProcessor } from './types';

function processor<R extends boolean>({
	required,
	displayName = 'Processor',
	description = 'The processor to run the document through.',
}: PropParams<R>) {
	return Property.Dropdown({
		auth: googleDocumentAiAuth,
		displayName,
		description,
		required,
		refreshers: [],
		options: async ({ auth }) => await processorOptions({ auth }),
	});
}

async function processorOptions({
	auth,
}: {
	auth: GoogleDocumentAiAuthValue | undefined;
}): Promise<DropdownState<string>> {
	if (!auth) {
		return disabledOptions({
			placeholder: 'Please select an existing or create a new connection.',
		});
	}
	try {
		const resolved = await googleDocumentAiApi.resolveAuth({ auth });
		const processors = await googleDocumentAiApi.listProcessors({ auth: resolved });
		if (processors.length === 0) {
			return disabledOptions({
				placeholder: `No processors in project ${resolved.projectId}, location ${resolved.location}. Create one in Document AI → Processors.`,
			});
		}
		const options = processors
			.map((p) => ({ label: processorLabel(p), value: p.name }))
			.sort((a, b) => a.label.localeCompare(b.label));
		return { disabled: false, options };
	} catch (error) {
		const detail = error instanceof Error ? error.message : String(error);
		return disabledOptions({ placeholder: `Could not list processors: ${detail.slice(0, 300)}` });
	}
}

function processorTypeLabel(type: string | undefined): string {
	if (!type) return 'unknown type';
	const words = type
		.replace(/_PROCESSOR$/, '')
		.toLowerCase()
		.split('_');
	return words
		.map((w, i) => (w === 'ocr' ? 'OCR' : i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
		.join(' ');
}

function processorLabel(processor: GoogleDocumentAiProcessor): string {
	const id = processor.name.split('/').pop() ?? processor.name;
	const state =
		processor.state && processor.state !== 'ENABLED' ? ` · ${processor.state.toLowerCase()}` : '';
	return `${processor.displayName ?? id} (${processorTypeLabel(processor.type)})${state} · ${id}`;
}

function disabledOptions({ placeholder }: { placeholder: string }): DropdownState<never> {
	return { disabled: true, options: [], placeholder };
}

export const googleDocumentAiProps = { processor };

export type PropParams<R extends boolean> = {
	required: R;
	displayName?: string;
	description?: string;
};

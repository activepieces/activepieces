import { createAction, Property } from '@activepieces/pieces-framework';
import { placidAuth } from '../auth';
import { PlacidClient, placidHelpers } from '../common/client';
import { placidSchemas } from '../common/output-schemas';
import { aiFilenameText, aiPassthroughText, waitForResultDropdown } from '../common/props';
import { PlacidCreateVideoRequest, PlacidVideoModifications } from '../common';

export const createVideoAi = createAction({
	auth: placidAuth,
	name: 'create_video_ai',
	classification: 'WRITE',
	displayName: 'Create Video (AI)',
	description: 'Render a video from one or more Placid templates (one per clip).',
	audience: 'ai',
	aiMetadata: {
		description:
			'Renders a video in Placid (max 3 minutes; uses about 10 Placid credits per 10 seconds of video). clips is a list, one entry per clip: [{"template_uuid": "...", "layers": {"title": {"text": "Hello"}, "clip": {"video": "https://..."}}}]. Get template UUIDs from List Templates (AI) and layer names from Get Template (AI); unknown layer names are rejected with the valid list. With wait_for_result "yes" (default) it waits up to 5 minutes and returns status "finished" with video_url; if still "queued" after that it returns the ID: call Get Video with it instead of creating again. Every call creates a new video.',
		idempotent: false,
	},
	outputSchema: placidSchemas.video,
	props: {
		clips: Property.Array({
			displayName: 'Clips',
			description: 'One entry per clip, each with a template UUID and an optional layers object {"<layer name>": {"text": "..."}}.',
			required: true,
			properties: {
				template_uuid: Property.ShortText({ displayName: 'Template UUID', required: true }),
				layers: Property.Json({ displayName: 'Layers', required: false }),
			},
		}),
		width: Property.Number({ displayName: 'Width', description: 'Optional output width in pixels.', required: false }),
		height: Property.Number({ displayName: 'Height', description: 'Optional output height in pixels.', required: false }),
		fps: Property.Number({ displayName: 'FPS', description: 'Frames per second, 1-30 (Placid default 25).', required: false }),
		filename: aiFilenameText,
		passthrough: aiPassthroughText,
		wait_for_result: waitForResultDropdown,
	},
	async run({ auth, propsValue }) {
		const clips = placidHelpers.parseTemplateParts({ value: propsValue.clips, field: 'clips' });
		const fps = propsValue.fps;
		if (fps !== undefined && fps !== null && (!Number.isInteger(fps) || fps < 1 || fps > 30)) {
			throw new Error('fps must be a whole number from 1 to 30.');
		}
		const client = new PlacidClient(auth);
		await placidHelpers.assertLayersExist({ client, parts: clips });
		const modifications: PlacidVideoModifications = {
			...(propsValue.width ? { width: propsValue.width } : {}),
			...(propsValue.height ? { height: propsValue.height } : {}),
			...(fps ? { fps } : {}),
			...(propsValue.filename ? { filename: propsValue.filename } : {}),
		};
		const request: PlacidCreateVideoRequest = {
			clips,
			...(Object.keys(modifications).length > 0 ? { modifications } : {}),
			...(propsValue.passthrough ? { passthrough: propsValue.passthrough } : {}),
			create_now: placidHelpers.toCreateNow(propsValue.wait_for_result),
		};
		return client.createVideo(request);
	},
});

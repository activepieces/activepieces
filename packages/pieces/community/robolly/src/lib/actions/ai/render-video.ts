import { createAction, Property } from '@activepieces/pieces-framework';

import { robollyAuth } from '../../auth';
import { robollyApi } from '../../common/api';

const fpsOptions = [
	{ label: '24', value: 24 },
	{ label: '30', value: 30 },
	{ label: '50', value: 50 },
	{ label: '60', value: 60 },
];

export const renderVideoAction = createAction({
	auth: robollyAuth,
	name: 'robolly_render_video',
	displayName: 'Render Video',
	description: 'Queues a video render built from one or more template clips.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Queues a video render from a timeline of template clips, with optional audio, and returns the render ID with status "queued". Poll Get Render with that ID until its status is "done" to get the video file URL. Each call uses render credits.',
		idempotent: false,
	},
	props: {
		timeline: Property.Json({
			displayName: 'Timeline',
			description:
				'JSON array of clips, in order: [{"templateId": "<from List Templates>", "duration": 5000, "modifications": [{"target": "<element name>", "value": "<value>", "in": 0, "out": 2000}]}]. duration is 500–20000 ms; in/out are optional, in ms.',
			required: true,
		}),
		audio: Property.Json({
			displayName: 'Audio',
			description:
				'Optional JSON array of audio tracks: [{"src": "<MP3 URL>", "in": 0, "out": 5000, "volume": 0.7}]. volume is 0.1–2.',
			required: false,
		}),
		fps: Property.StaticDropdown({
			displayName: 'FPS',
			description: 'Frames per second. Defaults to 30.',
			required: false,
			options: { options: fpsOptions },
		}),
		movieId: Property.ShortText({
			displayName: 'Movie ID',
			description: 'Optional ID to group this render with others; filter on it in List Renders.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		return await robollyApi.renderVideo({
			auth,
			timeline: propsValue.timeline,
			audio: propsValue.audio,
			fps: propsValue.fps,
			movieId: propsValue.movieId,
		});
	},
});

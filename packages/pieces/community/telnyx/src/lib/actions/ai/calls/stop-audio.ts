import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxStopAudioAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_stop_audio',
	displayName: 'Stop Audio',
	description: 'Stops audio playing on an active call.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Stops audio started by Play Audio on a call. Choose whether to stop only the current file or every queued file.',
		idempotent: false,
	},
	props: {
		callControlId: telnyxAiProps.callControlId({ required: true }),
		stop: Property.StaticDropdown({
			displayName: 'Stop',
			description: 'current stops the playing file; all also clears queued files. Defaults to all.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'current', value: 'current' },
					{ label: 'all', value: 'all' },
				],
			},
		}),
		overlay: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'Overlay',
			description: 'Whether to stop overlay audio instead of the main audio. Defaults to No.',
		}),
		clientState: telnyxAiProps.clientState({ required: false }),
		commandId: telnyxAiProps.commandId({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.sendCallCommand({
			auth: context.auth,
			callControlId: p.callControlId,
			command: 'playback_stop',
			body: telnyxUtils.compact({
				values: {
					stop: p.stop,
					overlay: p.overlay,
					client_state: p.clientState,
					command_id: p.commandId,
				},
			}),
		});
	},
});

import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxUpdateConferenceSupervisorRoleAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_update_conference_supervisor_role',
	displayName: 'Update Conference Supervisor Role',
	description: 'Changes the supervisor role of a conference participant.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Sets a participant's supervisor role: barge (heard by all), monitor (listens only), whisper (heard only by the Whisper Call Control IDs) or none.",
		idempotent: true,
	},
	props: {
		conferenceId: Property.ShortText({
			displayName: 'Conference ID',
			description: 'Conference ID, returned by Create Conference or List Conferences.',
			required: true,
		}),
		callControlId: telnyxAiProps.callControlId({ required: true }),
		supervisorRole: Property.StaticDropdown({
			displayName: 'Supervisor Role',
			description:
				'barge (heard by all), monitor (listen only), whisper (heard only by the Whisper Call Control IDs) or none.',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'Barge', value: 'barge' },
					{ label: 'Monitor', value: 'monitor' },
					{ label: 'Whisper', value: 'whisper' },
					{ label: 'None', value: 'none' },
				],
			},
		}),
		whisperCallControlIds: Property.Array({
			displayName: 'Whisper Call Control IDs',
			description: 'Call control IDs of the participants a whispering supervisor is heard by.',
			required: false,
		}),
		commandId: telnyxAiProps.commandId({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.runConferenceCommand({
			auth: context.auth,
			conferenceId: p.conferenceId,
			command: 'update',
			body: telnyxUtils.compact({
				values: {
					call_control_id: p.callControlId,
					supervisor_role: p.supervisorRole,
					whisper_call_control_ids: p.whisperCallControlIds,
					command_id: p.commandId,
				},
			}),
		});
	},
});

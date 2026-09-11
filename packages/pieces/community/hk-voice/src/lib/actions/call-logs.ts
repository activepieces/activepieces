import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { hkVoiceAuth } from '../auth';
import { hkVoiceApi } from '../common/client';

export const getCallLogAction = createAction({
    auth: hkVoiceAuth,
    name: 'get_call_log',
    classification: 'READ',
    displayName: 'Get Call Log',
    description:
        'Fetches one Voice call log by id (status, duration, disposition). Prefer webhooks for live outcomes; use this to poll or re-read.',
    audience: 'both',
    aiMetadata: {
        description:
            'Gets a Heykoala Voice call log via GET /call_logs/{id}/. Analysis may still be pending shortly after hangup.',
        idempotent: true,
    },
    props: {
        call_id: Property.ShortText({
            displayName: 'Call ID',
            description: 'UUID returned by Dispatch Outbound Call (call_id).',
            required: true,
        }),
    },
    async run(context) {
        const connection = hkVoiceApi.connectionFromAuth(context.auth);
        const body = await hkVoiceApi.request({
            ...connection,
            method: HttpMethod.GET,
            path: hkVoiceApi.paths.callLogById(context.propsValue.call_id.trim()),
        });
        return hkVoiceApi.flattenBody(body);
    },
});

export const getCallMediaAction = createAction({
    auth: hkVoiceAuth,
    name: 'get_call_media',
    classification: 'READ',
    displayName: 'Get Call Media',
    description:
        'Fetches signed recording and transcript URLs for a call. Links expire — download or use immediately (do not store the URL long-term).',
    audience: 'both',
    aiMetadata: {
        description:
            'Gets short-lived signed media links via GET /call_logs/{id}/media/. Use after call.recording_available or call.analysis_completed.',
        idempotent: true,
    },
    props: {
        call_id: Property.ShortText({
            displayName: 'Call ID',
            description: 'Voice call UUID.',
            required: true,
        }),
    },
    async run(context) {
        const connection = hkVoiceApi.connectionFromAuth(context.auth);
        const body = await hkVoiceApi.request({
            ...connection,
            method: HttpMethod.GET,
            path: hkVoiceApi.paths.callLogMedia(context.propsValue.call_id.trim()),
        });
        return hkVoiceApi.flattenBody(body);
    },
});

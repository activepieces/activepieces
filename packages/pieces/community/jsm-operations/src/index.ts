import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { acknowledgeAlertAction } from './lib/actions/acknowledge-alert';
import { addNoteAction } from './lib/actions/add-note';
import { addResponderAction } from './lib/actions/add-responder';
import { addTagsAction } from './lib/actions/add-tags';
import { assignAlertAction } from './lib/actions/assign-alert';
import { closeAlertAction } from './lib/actions/close-alert';
import { createAlertAction } from './lib/actions/create-alert';
import { jsmCustomApiCall } from './lib/actions/custom-api-call';
import { escalateAlertAction } from './lib/actions/escalate-alert';
import { findAlertsAction } from './lib/actions/find-alerts';
import { getAlertAction } from './lib/actions/get-alert';
import { getOnCallAction } from './lib/actions/get-on-call';
import { removeTagsAction } from './lib/actions/remove-tags';
import { snoozeAlertAction } from './lib/actions/snooze-alert';
import { unacknowledgeAlertAction } from './lib/actions/unacknowledge-alert';
import { updateAlertAction } from './lib/actions/update-alert';
import { jsmOpsAuth } from './lib/auth';
import { newAlertTrigger } from './lib/triggers/new-alert';

export const jsmOperations = createPiece({
    displayName: 'Jira Service Management Operations',
    description:
        'Opsgenie alerts in Jira Service Management: create, acknowledge, close and route on-call alerts, and see who is on call.',
    minimumSupportedRelease: '0.88.2',
    logoUrl: 'https://cdn.activepieces.com/pieces/jira.png',
    categories: [PieceCategory.DEVELOPER_TOOLS],
    auth: jsmOpsAuth,
    authors: ['OdaiAhmed99'],
    actions: [
        createAlertAction,
        getAlertAction,
        findAlertsAction,
        acknowledgeAlertAction,
        unacknowledgeAlertAction,
        closeAlertAction,
        addNoteAction,
        addTagsAction,
        removeTagsAction,
        assignAlertAction,
        addResponderAction,
        escalateAlertAction,
        snoozeAlertAction,
        updateAlertAction,
        getOnCallAction,
        jsmCustomApiCall.withCloudId(
            createCustomApiCallAction({
                auth: jsmOpsAuth,
                baseUrl: jsmCustomApiCall.baseUrl,
                authMapping: jsmCustomApiCall.authMapping,
            }),
        ),
    ],
    triggers: [newAlertTrigger],
});

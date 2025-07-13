
    import { createPiece } from "@activepieces/pieces-framework";
    import { addSubscriber } from './lib/actions/add-subscriber';
    import { updateSubscriber } from './lib/actions/update-subscriber';
    import { unsubscribeUser } from './lib/actions/unsubscribe-user';
    import { deleteContact } from './lib/actions/delete-contact';
    import { changeVariableForSubscriber } from './lib/actions/change-variable-for-subscriber';
    import { newSubscriberTrigger } from './lib/triggers/trigger-new-subscriber';
    import { updatedSubscriberTrigger } from './lib/triggers/trigger-updated-subscriber';
    import { unsubscriberTrigger } from './lib/triggers/trigger-unsubscriber';
    import { sendPulseAuth } from './lib/common/auth';

    export const sendpulse = createPiece({
      displayName: "Sendpulse",
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/sendpulse.png",
      authors: ['sparkybug'],
      auth: sendPulseAuth,
      actions: [addSubscriber, updateSubscriber, unsubscribeUser, deleteContact, changeVariableForSubscriber],
      triggers: [newSubscriberTrigger, updatedSubscriberTrigger, unsubscriberTrigger],
    });
    
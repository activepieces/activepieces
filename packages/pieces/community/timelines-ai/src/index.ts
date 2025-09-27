
    import { createPiece } from "@activepieces/pieces-framework";
    import { timelinesAiAuth } from '../src/lib/common/auth';
    import { closeChatAction } from '../src/lib/actions/close-chat';
    import { findChatAction } from '../src/lib/actions/find-chat';
    import { findMessageStatusAction } from '../src/lib/actions/find-message-status';
    import { findMessageAction } from '../src/lib/actions/find-message';
    import { findUploadedFileAction } from '../src/lib/actions/find-uploaded-file';
    import { findWhatsappAccountAction } from '../src/lib/actions/find-whatsapp-account';
    import { sendFileToExistingChatAction } from '../src/lib/actions/send-file-to-existing-chat';
    import { sendMessageToNewChatAction } from '../src/lib/actions/send-message-to-new-chat';
    import { sendMessageToExistingChatAction } from '../src/lib/actions/send-message-to-existing-chat';
    import { sendUploadedFileToExistingChatAction } from '../src/lib/actions/send-uploaded-file-to-existing-chat';
    import { chatClosedTrigger } from '../src/lib/triggers/chat-closed';
    import { chatRenamedTrigger } from '../src/lib/triggers/chat-renamed';
    import { newIncomingChatTrigger } from '../src/lib/triggers/new-incoming-chat';
    import { newOutgoingChatTrigger } from '../src/lib/triggers/new-outgoing-chat';
    import { newReceivedMessageTrigger } from '../src/lib/triggers/new-received-message';
    import { newSentMessageTrigger } from '../src/lib/triggers/new-sent-message';
    import { newUploadedFileTrigger } from '../src/lib/triggers/new-uploaded-file';
    import { newWhatsappAccountTrigger } from '../src/lib/triggers/new-whatsapp-account';

    export const timelinesAi = createPiece({
      displayName: 'Timelines-ai',
      auth: timelinesAiAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: 'https://cdn.activepieces.com/pieces/timelines-ai.png',
      authors: ['Prabhukiran161'],
      actions: [
        closeChatAction,
        findChatAction,
        findMessageStatusAction,
        findMessageAction,
        findUploadedFileAction,
        findWhatsappAccountAction,
        sendFileToExistingChatAction,
        sendMessageToNewChatAction,
        sendMessageToExistingChatAction,
        sendUploadedFileToExistingChatAction,
      ],
      triggers: [
        chatClosedTrigger,
        chatRenamedTrigger,
        newIncomingChatTrigger,
        newOutgoingChatTrigger,
        newReceivedMessageTrigger,
        newSentMessageTrigger,
        newUploadedFileTrigger,
        newWhatsappAccountTrigger,
      ],
    });
    
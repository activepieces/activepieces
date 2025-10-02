
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { createCampaign } from "./lib/actions/create-campaign";
import { sendCampaign } from "./lib/actions/send-campaign";
import { addUpdateSubscriber } from "./lib/actions/add-update-subscriber";
import { unsubscribeSubscriber } from "./lib/actions/unsubscribe-subscriber";
import { addSubscriberToGroup } from "./lib/actions/add-subscriber-to-group";
import { removeSubscriberFromGroup } from "./lib/actions/remove-subscriber-from-group";
import { newCampaign } from "./lib/triggers/new-campaign";
import { newGroup } from "./lib/triggers/new-group";
import { newSubscriberInGroup } from "./lib/triggers/new-subscriber-in-group";
import { newSubscriber } from "./lib/triggers/new-subscriber";
import { newUnsubscriber } from "./lib/triggers/new-unsubscriber";
import { newUnsubscriberFromGroup } from "./lib/triggers/new-unsubscriber-from-group";
import { updatedSubscriber } from "./lib/triggers/updated-subscriber";
import { SenderAuth } from "./lib/common/auth";

export const sender = createPiece({
  displayName: "Sender",
  auth: SenderAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/sender.png",
  authors: ["Niket2035"],
  actions: [createCampaign, sendCampaign, addUpdateSubscriber, unsubscribeSubscriber, addSubscriberToGroup, removeSubscriberFromGroup,],
  triggers: [newCampaign, newGroup, newSubscriberInGroup, newSubscriber, newUnsubscriber, newUnsubscriberFromGroup, updatedSubscriber],
});

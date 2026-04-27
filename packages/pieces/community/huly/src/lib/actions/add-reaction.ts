import { createAction, Property } from "@activepieces/pieces-framework";
import { addReaction } from "@hulymcp/huly/operations/activity.js";
import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const addReactionAction = createAction({
  auth: hulyAuth,
  name: "add_reaction",
  displayName: "Add Reaction",
  description: "Add an emoji reaction to an activity message",
  props: {
    message_id: Property.ShortText({
      displayName: "Message ID",
      description: "ID of the activity message to react to",
      required: true,
    }),
    emoji: Property.ShortText({
      displayName: "Emoji",
      description: "Emoji to react with (e.g., thumbsup, heart, rocket)",
      required: true,
    }),
  },
  async run(context) {
    const result = await withHulyClient(
      context.auth,
      addReaction({
        messageId: context.propsValue.message_id,
        emoji: context.propsValue.emoji,
      })
    );
    return { reaction_id: result.reactionId, message_id: result.messageId };
  },
});

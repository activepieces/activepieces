import { sendEmail } from "./send-email";
import { moveEmail } from "./move-email";
import { markEmailAsRead } from "./mark-email-as-read";
import { markEmailAsUnread } from "./mark-email-as-unread";
import { getEmailDetails } from "./get-email-details";

export const zohoMailActions = [
    sendEmail,
    moveEmail,
    markEmailAsRead,
    markEmailAsUnread,
    getEmailDetails,
];

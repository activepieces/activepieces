import { newEmailReceived } from "./new-email-received-trigger";
import { newEmailMatchingSearch } from "./new-email-matching-search-trigger";
import { newEmailInFolder } from "./new-email-in-folder-trigger";

export const zohoMailTriggers = [
    newEmailReceived,
    newEmailMatchingSearch,
    newEmailInFolder,
];

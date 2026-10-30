import { pastebinDeletePasteAction } from './delete-paste';
import { pastebinGetAccountDetailsAction } from './get-account-details';
import { pastebinListPastesAction } from './list-pastes';

export const pastebinAiActions = [
  pastebinListPastesAction,
  pastebinDeletePasteAction,
  pastebinGetAccountDetailsAction,
];

import { listOrgShortlinksAction } from './list-org-shortlinks.action';
import { listUserShortlinksAction } from './list-user-shortlinks.action';
import { createShortlinkAction } from './create-shortlink.action';
import { updateShortlinkAction } from './update-shortlink.action';
import { deleteShortlinkAction } from './delete-shortlink.action';

export const SHORTLINKS_ACTIONS = [
  listOrgShortlinksAction,
  listUserShortlinksAction,
  createShortlinkAction,
  updateShortlinkAction,
  deleteShortlinkAction,
];

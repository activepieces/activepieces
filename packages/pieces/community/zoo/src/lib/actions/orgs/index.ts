import { getOrgAction } from './get-org.action';
import { updateOrgAction } from './update-org.action';
import { createOrgAction } from './create-org.action';
import { listOrgMembersAction } from './list-org-members.action';
import { addOrgMemberAction } from './add-org-member.action';
import { getOrgMemberAction } from './get-org-member.action';

export const ORGS_ACTIONS = [
  getOrgAction,
  updateOrgAction,
  createOrgAction,
  listOrgMembersAction,
  addOrgMemberAction,
  getOrgMemberAction,
];

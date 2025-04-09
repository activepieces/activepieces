import { addOrgMemberAction } from './add-org-member.action'
import { createOrgAction } from './create-org.action'
import { getOrgMemberAction } from './get-org-member.action'
import { getOrgAction } from './get-org.action'
import { listOrgMembersAction } from './list-org-members.action'
import { updateOrgAction } from './update-org.action'

export const ORGS_ACTIONS = [
  getOrgAction,
  updateOrgAction,
  createOrgAction,
  listOrgMembersAction,
  addOrgMemberAction,
  getOrgMemberAction,
]

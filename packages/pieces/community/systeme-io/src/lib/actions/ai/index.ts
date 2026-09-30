import { systemeAddTagToContact } from './add-tag-to-contact';
import { systemeCreateContact } from './create-contact';
import { systemeGetTag } from './get-tag';
import { systemeListCommunities } from './list-communities';
import { systemeListCommunityMemberships } from './list-community-memberships';
import { systemeListContactFields } from './list-contact-fields';
import { systemeListCourses } from './list-courses';
import { systemeListEnrollments } from './list-enrollments';
import { systemeListSubscriptions } from './list-subscriptions';
import { systemeListTags } from './list-tags';
import { systemeRenameTag } from './rename-tag';
import { systemeUpdateContact } from './update-contact';

export const systemeAiActions = [
  systemeCreateContact,
  systemeUpdateContact,
  systemeAddTagToContact,
  systemeListTags,
  systemeGetTag,
  systemeRenameTag,
  systemeListContactFields,
  systemeListCourses,
  systemeListEnrollments,
  systemeListCommunities,
  systemeListCommunityMemberships,
  systemeListSubscriptions,
];

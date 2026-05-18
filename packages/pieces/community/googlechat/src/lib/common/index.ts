export * from './schemas';
export * from './constants';
export * from './props';
export * from './requests';

import * as schemas from './schemas';

export const googleChatCommon = {
  sendMessageSchema: schemas.sendMessageSchema,
  getMessageSchema: schemas.getMessageSchema,
  addSpaceMemberSchema: schemas.addSpaceMemberSchema,
  findMemberSchema: schemas.findMemberSchema,
  searchMessagesSchema: schemas.searchMessagesSchema,
  getDirectMessageDetailsSchema: schemas.getDirectMessageDetailsSchema,
  newMessageTriggerSchema: schemas.newMessageTriggerSchema,
  newMentionTriggerSchema: schemas.newMentionTriggerSchema,
};

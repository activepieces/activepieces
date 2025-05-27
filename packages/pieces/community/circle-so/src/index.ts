import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { addMemberToSpaceAction, createCommentAction, createPostAction, findMemberByEmailAction, getMemberDetailsAction, getPostDetailsAction } from './lib/actions';
import { newPostCreatedTrigger, newMemberAddedTrigger, newCommentPostedTrigger } from './lib/triggers';

export const circleAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Generate your Admin API key in Circle by navigating to Developers > Tokens.',
});

export const circle = createPiece({
  displayName: 'Circle.so',
  description: 'Automate community interactions with Circle.so using the Admin API',
  auth: circleAuth,
  logoUrl: 'https://cdn.activepieces.com/pieces/circle.png',
  authors: ['krushnarout'],
  categories: [PieceCategory.COMMUNICATION],
  actions: [addMemberToSpaceAction, createCommentAction, createPostAction, findMemberByEmailAction, getMemberDetailsAction, getPostDetailsAction],
  triggers: [newPostCreatedTrigger, newMemberAddedTrigger, newCommentPostedTrigger],
});

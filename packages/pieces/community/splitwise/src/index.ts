
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { createExpenseAction } from './lib/actions/create-expense';
import { newExpenseTrigger } from './lib/triggers/new-expense';
import { PieceCategory } from "@activepieces/shared";
import { splitwiseAuth } from './lib/auth';

const markdownDescription = `
You can generate an API key from your app's details page on Splitwise.
The API key should be kept secure as it provides access to your personal account.
`;

export const splitwise = createPiece({
  displayName: "Splitwise",
  auth: splitwiseAuth,
  minimumSupportedRelease: '0.36.1',
  description: "Splitwise is a expense splitting app that helps you track and settle bills with friends, family, and roommates.",
  categories: [PieceCategory.ACCOUNTING],
  logoUrl: "https://cdn.activepieces.com/pieces/splitwise.png",
  authors: ["onyedikachi-david"],
  actions: [createExpenseAction],
  triggers: [newExpenseTrigger],
});

import { describe, expect, it } from 'vitest';

import { amazonLambda } from '../index';

describe('amazonLambda', () => {
  describe('when the builder lists the piece', () => {
    it('should show AWS Lambda as the display name', () => {
      expect(amazonLambda.displayName).toBe('AWS Lambda');
    });
  });

  describe('when a connection is offered', () => {
    it('given access-key and IAM role, should offer both connections', () => {
      const auth = amazonLambda.auth as { displayName: string }[];

      expect(Array.isArray(amazonLambda.auth)).toBe(true);
      expect(auth.map((item) => item.displayName)).toEqual([
        'AWS Lambda (Access Key)',
        'AWS Lambda (IAM Role / OIDC)',
      ]);
    });
  });

  describe('when the piece is registered', () => {
    it('should expose invoke, get-details, the custom call, and the trigger under unique names', () => {
      const actionNames = Object.keys(amazonLambda.actions());
      const triggerNames = Object.keys(amazonLambda.triggers());

      expect(actionNames).toEqual(['invokeFunction', 'getFunctionDetails', 'customApiCall']);
      expect(triggerNames).toEqual(['newFunctionCreated']);
      expect(new Set([...actionNames, ...triggerNames]).size).toBe(actionNames.length + triggerNames.length);
    });
  });
});

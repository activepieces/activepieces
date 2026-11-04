import { createAction, Property } from '@activepieces/pieces-framework';
import {
  GuardrailChecksContentFilterCategory,
  GuardrailChecksPromptAttackCategory,
  GuardrailChecksRole,
  GuardrailChecksSensitiveInformationEntityType,
  InvokeGuardrailChecksCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { awsBedrockCombinedAuth } from '../../../auth';
import { bedrockAi } from '../common';
import { amazonBedrockInvokeGuardrailChecksOutputSchema } from '../../../output-schemas';

export const amazonBedrockInvokeGuardrailChecks = createAction({
  auth: awsBedrockCombinedAuth,
  name: 'amazon_bedrock_invoke_guardrail_checks',
  outputSchema: amazonBedrockInvokeGuardrailChecksOutputSchema,
  displayName: 'Invoke Guardrail Checks',
  description: 'Runs inline content, prompt-attack and sensitive-information checks on a text, with no guardrail to set up.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Runs Amazon Bedrock guardrail checks on a text without creating a guardrail first: harmful-content categories (hate, insults, misconduct, sexual, violence), prompt attacks (jailbreak, prompt injection, prompt leakage) and sensitive-information types (email, phone, credit card…). Pick at least one check. Bills per text unit but changes nothing.',
    idempotent: true,
  },
  props: {
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text to check.',
      required: true,
    }),
    role: Property.StaticDropdown({
      displayName: 'Role',
      description: 'Who wrote the text. Defaults to user.',
      required: false,
      options: bedrockAi.enumOptions(GuardrailChecksRole),
    }),
    contentFilterCategories: Property.StaticMultiSelectDropdown({
      displayName: 'Content Filter Categories',
      description: 'Harmful-content categories to detect.',
      required: false,
      options: bedrockAi.enumOptions(GuardrailChecksContentFilterCategory),
    }),
    promptAttackCategories: Property.StaticMultiSelectDropdown({
      displayName: 'Prompt Attack Categories',
      description: 'Prompt attacks to detect.',
      required: false,
      options: bedrockAi.enumOptions(GuardrailChecksPromptAttackCategory),
    }),
    sensitiveInformationTypes: Property.StaticMultiSelectDropdown({
      displayName: 'Sensitive Information Types',
      description: 'Kinds of personal or secret data to detect, e.g. EMAIL, PHONE, CREDIT_DEBIT_CARD_NUMBER.',
      required: false,
      options: bedrockAi.enumOptions(GuardrailChecksSensitiveInformationEntityType),
    }),
  },
  async run({ auth, propsValue, server }) {
    const contentFilter = enumList({
      values: propsValue.contentFilterCategories,
      allowed: GuardrailChecksContentFilterCategory,
      prop: 'Content Filter Categories',
    });
    const promptAttack = enumList({
      values: propsValue.promptAttackCategories,
      allowed: GuardrailChecksPromptAttackCategory,
      prop: 'Prompt Attack Categories',
    });
    const sensitiveInformation = enumList({
      values: propsValue.sensitiveInformationTypes,
      allowed: GuardrailChecksSensitiveInformationEntityType,
      prop: 'Sensitive Information Types',
    });
    if (contentFilter.length + promptAttack.length + sensitiveInformation.length === 0) {
      throw new Error('Pick at least one of Content Filter Categories, Prompt Attack Categories or Sensitive Information Types.');
    }
    const client = await bedrockAi.runtime({ auth: auth.props, server });
    const response = await client.send(
      new InvokeGuardrailChecksCommand({
        messages: [
          {
            role: bedrockAi.enumValue({ value: propsValue.role, allowed: GuardrailChecksRole, prop: 'Role' }) ?? 'user',
            content: [{ text: propsValue.text }],
          },
        ],
        checks: {
          contentFilter: contentFilter.length > 0 ? { categories: contentFilter.map((category) => ({ category })) } : undefined,
          promptAttack: promptAttack.length > 0 ? { categories: promptAttack.map((category) => ({ category })) } : undefined,
          sensitiveInformation:
            sensitiveInformation.length > 0 ? { entities: sensitiveInformation.map((type) => ({ type })) } : undefined,
        },
      }),
    );
    return bedrockAi.body(response);
  },
});

function enumList<T extends string>({
  values,
  allowed,
  prop,
}: {
  values: unknown[] | undefined;
  allowed: Record<string, T>;
  prop: string;
}): T[] {
  return (values ?? []).flatMap((value) => {
    const match = bedrockAi.enumValue({ value: String(value), allowed, prop });
    return match === undefined ? [] : [match];
  });
}

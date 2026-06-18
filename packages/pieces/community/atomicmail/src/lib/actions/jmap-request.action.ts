import { createAction, Property } from '@activepieces/pieces-framework';
import { BUNDLED_OPS_PRESET_NAMES, readOpsFile } from '@atomicmail/agentic-core';

import { executeOpsJson, parseVarsJson } from '../common/jmap';
import {
  accountIdProp,
  optionalApiKeyProp,
  projectStoreHintProp,
} from '../common/props';
import {
  assertStoredCredentials,
  createSession,
  normalizeAccountId,
} from '../common/session';

export const jmapRequestAction = createAction({
  requireAuth: false,
  name: 'jmap_request',
  displayName: 'JMAP Request',
  description:
    'Run a custom JMAP batch using inline JSON or a bundled preset.',
  audience: 'both',
  aiMetadata: {
    description:
      'Advanced JMAP batch call. Provide exactly one of ops or ops_file; use help topic presets first. Supports dry_run preview. PoW runs only if session JWT expired.',
    idempotent: false,
  },
  props: {
    store_hint: projectStoreHintProp,
    ops: Property.LongText({
      displayName: 'Ops JSON',
      description: 'Custom JMAP methodCalls array or envelope JSON',
      required: false,
    }),
    ops_file: Property.StaticDropdown({
      displayName: 'Preset',
      description: 'Bundled preset file (see Help → presets)',
      required: false,
      options: {
        disabled: false,
        options: BUNDLED_OPS_PRESET_NAMES.map((name) => ({
          label: name,
          value: name,
        })),
      },
    }),
    vars: Property.LongText({
      displayName: 'Vars JSON',
      description: 'Optional placeholder variables (uppercase keys, e.g. `$MAIL_ID`)',
      required: false,
    }),
    dry_run: Property.Checkbox({
      displayName: 'Dry run',
      description: 'Preview the request without sending it to the API',
      required: false,
      defaultValue: false,
    }),
    account_id: accountIdProp,
    api_key: optionalApiKeyProp,
  },
  async run(context) {
    const { ops, ops_file, dry_run } = context.propsValue;
    const hasOps = typeof ops === 'string' && ops.trim().length > 0;
    const hasOpsFile = typeof ops_file === 'string' && ops_file.length > 0;
    if (hasOps === hasOpsFile) {
      throw new Error('Provide exactly one of Ops JSON or Ops File.');
    }

    const accountId = normalizeAccountId(context.propsValue.account_id);
    const inlineKey = context.propsValue.api_key?.trim();
    await assertStoredCredentials(context, accountId, inlineKey || undefined);
    const session = await createSession(context, accountId);
    const vars = parseVarsJson(context.propsValue.vars);

    if (hasOpsFile) {
      const opsJson = await readOpsFile(session.credentialDir, ops_file!);
      const result = await executeOpsJson(
        session,
        opsJson,
        vars,
        dry_run === true,
      );
      return result.body;
    }

    const result = await executeOpsJson(
      session,
      ops!.trim(),
      vars,
      dry_run === true,
    );
    return result.body;
  },
});

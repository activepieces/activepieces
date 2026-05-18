import {
  createTrigger,
  Property,
  StoreScope,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { makeClient } from '../common';
import { createHash } from 'crypto';
import { pastefyAuth } from '../..';

export default createTrigger({
  auth: pastefyAuth,
  name: 'paste_changed',
  displayName: 'Paste Changed',
  description: 'Triggers when the content (or title) of the paste changes',
  type: TriggerStrategy.POLLING,
  props: {
    paste_id: Property.ShortText({
      displayName: 'Paste ID',
      required: true,
    }),
    include_title: Property.Checkbox({
      displayName: 'Include Title',
      required: false,
    }),
  },
  sampleData: {},
  onEnable: async (context) => {
    const client = makeClient(context.auth, context.propsValue);
    const paste = await client.getPaste(context.propsValue.paste_id);
    const hash = createHash('md5')
      .update(
        paste.content + (context.propsValue.include_title ? paste.title : '')
      )
      .digest('hex');
    await context.store.put(
      'paste_changed_trigger_hash',
      hash,
      StoreScope.FLOW
    );
  },
  onDisable: async (context) => {
    await context.store.delete('paste_changed_trigger_hash', StoreScope.FLOW);
  },
  run: async (context) => {
    const oldHash = await context.store.get(
      'paste_changed_trigger_hash',
      StoreScope.FLOW
    );
    const client = makeClient(context.auth, context.propsValue);
    const paste = await client.getPaste(context.propsValue.paste_id);
    const newHash = createHash('md5')
      .update(
        paste.content + (context.propsValue.include_title ? paste.title : '')
      )
      .digest('hex');
    if (oldHash != newHash) {
      await context.store.put(
        'paste_changed_trigger_hash',
        newHash,
        StoreScope.FLOW
      );
      return [paste];
    }
    return [];
  },
  test: async (context) => {
    const client = makeClient(context.auth, context.propsValue);
    const paste = await client.getPaste(context.propsValue.paste_id);
    return [paste];
  },
});

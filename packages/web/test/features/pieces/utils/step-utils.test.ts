/**
 * @vitest-environment jsdom
 */
import { readFileSync } from 'fs';
import path from 'path';

import { LocalesEnum } from '@activepieces/core-utils';
import { FlowAction, FlowActionType } from '@activepieces/shared';
import i18n from 'i18next';
import { beforeAll, describe, expect, it } from 'vitest';

const JAPANESE_BUNDLE = {
  Code: 'コード',
  'Powerful Node.js & TypeScript code with npm':
    'npm の強力な Node.js & TypeScript コード',
  'Loop on Items': 'アイテムでループ',
  'Iterate over a list of items': '項目のリストを反復処理します',
  Router: 'ルーター',
  'Split your flow into branches depending on condition(s)':
    '条件に応じてフローを分岐します',
  'Empty Trigger': '空のトリガー',
};

const loopStep: FlowAction = {
  name: 'step_1',
  displayName: 'Loop on Items',
  valid: true,
  lastUpdatedDate: '2026-08-24T00:00:00.000Z',
  type: FlowActionType.LOOP_ON_ITEMS,
  settings: { items: '' },
};

let stepUtils: typeof import('@/features/pieces/utils/step-utils').stepUtils;

describe('core step metadata translation', () => {
  beforeAll(async () => {
    await i18n.init({
      lng: LocalesEnum.ENGLISH,
      fallbackLng: LocalesEnum.ENGLISH,
      keySeparator: false,
      nsSeparator: false,
      resources: {},
    });

    ({ stepUtils } = await import('@/features/pieces/utils/step-utils'));

    i18n.addResourceBundle(
      LocalesEnum.JAPANESE,
      'translation',
      JAPANESE_BUNDLE,
    );
    await i18n.changeLanguage(LocalesEnum.JAPANESE);
  }, 60000);

  it('translates a core step resolved through getMetadata', async () => {
    const metadata = await stepUtils.getMetadata(
      loopStep,
      LocalesEnum.JAPANESE,
    );

    expect(metadata.displayName).toBe('アイテムでループ');
    expect(metadata.description).toBe('項目のリストを反復処理します');
  });

  it('translates every core action offered by the piece selector', () => {
    const coreActions = stepUtils.coreActionsMetadata();

    expect(coreActions).toHaveLength(3);
    for (const step of coreActions) {
      expect(Object.values(JAPANESE_BUNDLE)).toContain(step.displayName);
      expect(Object.values(JAPANESE_BUNDLE)).toContain(step.description);
    }
  });

  it('exposes every core step string in the english translation file', () => {
    const englishKeys = Object.keys(
      JSON.parse(
        readFileSync(
          path.resolve(
            __dirname,
            '../../../../public/locales/en/translation.json',
          ),
          'utf-8',
        ),
      ),
    );

    for (const key of Object.keys(JAPANESE_BUNDLE)) {
      expect(englishKeys).toContain(key);
    }
  });
});

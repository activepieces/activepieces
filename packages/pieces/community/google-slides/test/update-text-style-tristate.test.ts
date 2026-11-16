import { PropertyType } from '@activepieces/pieces-framework';
import { describe, expect, it } from 'vitest';
import { updateTextStyle } from '../src/lib/actions/update-text-style';
import { slidesElementRequests } from '../src/lib/commons/element-requests';
import { slidesElements } from '../src/lib/commons/elements';

const STYLE_KEYS = ['bold', 'italic', 'underline', 'strikethrough'] as const;

function buildFromProps(props: Record<string, unknown>) {
  return slidesElementRequests.buildTextStyle({
    ...Object.fromEntries(
      STYLE_KEYS.map((key) => [key, slidesElements.readBoolean({ value: props[key], label: key })]),
    ),
    fontSizePt: slidesElements.readPositive({ value: props['font_size'], label: 'Font Size (pt)' }),
  });
}

describe('update_text_style tri-state flags', () => {
  it('uses string yes/no dropdowns with a Leave unchanged option', () => {
    for (const key of STYLE_KEYS) {
      const prop = updateTextStyle.props[key];
      expect(prop.type).toBe(PropertyType.STATIC_DROPDOWN);
      const options = 'options' in prop && isOptionList(prop.options) ? prop.options.options : [];
      expect(options.map((o) => o.value)).toEqual(['', 'yes', 'no']);
      expect(options[0]?.label).toBe('Leave unchanged');
    }
  });

  it('leaves the four styles out of the fields mask on a font-size-only change', () => {
    for (const empty of [undefined, null, '']) {
      const { style, fields } = buildFromProps({
        bold: empty,
        italic: empty,
        underline: empty,
        strikethrough: empty,
        font_size: 24,
      });
      expect(fields).toEqual(['fontSize']);
      expect(style).toEqual({ fontSize: { magnitude: 24, unit: 'PT' } });
    }
  });

  it('sends yes as true and no as false', () => {
    const { style, fields } = buildFromProps({ bold: 'yes', italic: 'no' });
    expect(fields).toEqual(['bold', 'italic']);
    expect(style).toEqual({ bold: true, italic: false });
  });

  it('rejects other values', () => {
    expect(() => slidesElements.readBoolean({ value: 'maybe', label: 'Bold' })).toThrow('Bold must be yes/no or true/false, got "maybe".');
  });
});

function isOptionList(value: unknown): value is { options: { label: string; value: unknown }[] } {
  return typeof value === 'object' && value !== null && 'options' in value && Array.isArray(value.options);
}

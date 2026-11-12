import { describe, expect, it } from 'vitest';
import { piecePropertiesUtils, Property } from '../src/lib/property';

describe('piecePropertiesUtils.coerceInput', () => {
  const props = {
    hour_of_the_day: Property.StaticDropdown({ displayName: 'Hour', required: true, options: { options: [{ label: '9 am', value: 9 }, { label: '11 am', value: 11 }] } }),
    days: Property.StaticMultiSelectDropdown({ displayName: 'Days', required: false, options: { options: [{ label: 'Mon', value: 1 }, { label: 'Tue', value: 2 }] } }),
    run_on_weekends: Property.Checkbox({ displayName: 'Run on weekends', required: true, defaultValue: false }),
    timezone: Property.StaticDropdown({ displayName: 'Timezone', required: true, options: { options: [{ label: 'UTC', value: 'UTC' }] } }),
  };

  it('turns values saved as text into the type the field declares', () => {
    const coerced = piecePropertiesUtils.coerceInput({
      props,
      input: { hour_of_the_day: '11', days: ['1', 2], run_on_weekends: 'false', timezone: 'UTC' },
    });
    expect(coerced).toEqual({ hour_of_the_day: 11, days: [1, 2], run_on_weekends: false, timezone: 'UTC' });
  });

  it('keeps an object option that was copied as is', () => {
    const objectProps = {
      target: Property.StaticDropdown({ displayName: 'Target', required: true, options: { options: [{ label: 'A', value: { id: 'a' } }, { label: 'B', value: { id: 'b' } }] } }),
    };
    expect(piecePropertiesUtils.coerceInput({ props: objectProps, input: { target: { id: 'b' } } })).toEqual({ target: { id: 'b' } });
  });

  it('leaves values that match no option, references and unknown keys as they are', () => {
    const input = { hour_of_the_day: '25', run_on_weekends: '{{trigger.weekend}}', note: 'false' };
    expect(piecePropertiesUtils.coerceInput({ props, input })).toEqual(input);
  });
});

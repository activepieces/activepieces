import { describe, expect, it } from 'vitest';

import { svgPathUtils } from '@/app/builder/flow-canvas/utils/svg-path-utils';

const normalize = (path: string) =>
  path
    .replace(/([MmLlHhVvAa])\s*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

describe('svgPathUtils.transposePath', () => {
  it('swaps move coordinates', () => {
    expect(normalize(svgPathUtils.transposePath('M 10 20'))).toEqual('M20 10');
  });

  it('turns vertical lines into horizontal lines and vice versa', () => {
    expect(normalize(svgPathUtils.transposePath('M 0 0 v50 h-30'))).toEqual(
      'M0 0 h50 v-30',
    );
  });

  it('transposes arcs by swapping radii, flipping sweep and swapping deltas', () => {
    expect(
      normalize(svgPathUtils.transposePath('a15,15 0 0,0 -15,15')),
    ).toEqual('a15,15 0 0,1 15,-15');
    expect(normalize(svgPathUtils.transposePath('a12,12 0 0,1 12,-12'))).toEqual(
      'a12,12 0 0,0 -12,12',
    );
  });

  it('handles negative radii the same way the svg spec does (absolute value)', () => {
    expect(
      normalize(svgPathUtils.transposePath('a-15,-15 0 0,0 15,-15')),
    ).toEqual('a15,15 0 0,1 -15,15');
  });

  it('transposes relative move and line commands used by arrow heads', () => {
    expect(
      normalize(svgPathUtils.transposePath('m6 -6 l-6 6 m-6 -6 l6 6')),
    ).toEqual('m-6 6 l6 -6 m-6 -6 l6 6');
  });

  it('is an involution (applying it twice restores the path)', () => {
    const path = `M 116 60 v30 a15,15 0 0,0 -15,15 h -80 a15,15 0 0,1 15,15 v46 m6 -6 l-6 6 m-6 -6 l6 6`;
    const twice = svgPathUtils.transposePath(svgPathUtils.transposePath(path));
    expect(normalize(twice)).toEqual(normalize(path));
  });

  it('keeps multi-subpath structure', () => {
    const path = 'M 0 0 v10 M 5 6 h7';
    expect(normalize(svgPathUtils.transposePath(path))).toEqual(
      'M0 0 h10 M6 5 v7',
    );
  });
});

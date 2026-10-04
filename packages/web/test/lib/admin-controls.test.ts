import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { AdminControl } from '@/lib/admin-control';

const CONTROL_ID_PATTERN =
  /^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*\.(open|submit|confirm|toggle|select|copy|link|run)$/;

const SOURCE_ROOT = join(__dirname, '..', '..', 'src');
const ENUM_FILE = join(SOURCE_ROOT, 'lib', 'admin-control.ts');

const adminControlEntries = Object.entries(AdminControl);

describe('AdminControl', () => {
  it('names every id area.thing.action with a verb from the fixed set', () => {
    const malformed = Object.values(AdminControl).filter(
      (id) => !CONTROL_ID_PATTERN.test(id),
    );

    expect(malformed).toEqual([]);
  });

  it('spells every member as its id in upper case with underscores', () => {
    const drifted = adminControlEntries.filter(
      ([member, id]) => member !== id.toUpperCase().replace(/[.-]/g, '_'),
    );

    expect(drifted).toEqual([]);
  });

  it('keeps the consent controls of the Configurations page out of the enum', () => {
    const consent = Object.values(AdminControl).filter((id) =>
      id.startsWith('configurations.'),
    );

    expect(consent).toEqual([]);
  });

  it('uses every member on at least one control', () => {
    const source = sourceFiles({ directory: SOURCE_ROOT })
      .filter((file) => file !== ENUM_FILE)
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n');
    const unused = adminControlEntries
      .filter(([member]) => !source.includes(`AdminControl.${member}`))
      .map(([member]) => member);

    expect(unused).toEqual([]);
  });
});

function sourceFiles({ directory }: { directory: string }): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      return sourceFiles({ directory: path });
    }
    return /\.tsx?$/.test(entry) ? [path] : [];
  });
}

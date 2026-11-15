/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-attribute, testing-library/no-node-access -- @testing-library/jest-dom is not a dependency of packages/web */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { adminLayout } from '@/app/components/admin/admin-layout';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';

function OpenPicker({ modal }: { modal?: boolean }) {
  return (
    <Popover open modal={modal}>
      <PopoverTrigger>{'Pick'}</PopoverTrigger>
      <PopoverContent>{'Picker list'}</PopoverContent>
    </Popover>
  );
}

function isHiddenFromReaders(element: Element): boolean {
  return element.closest('[aria-hidden="true"]') !== null;
}

describe('popovers inside dialogs', () => {
  it('render outside the scrolling dialog and own the scroll lock', () => {
    render(
      <Dialog open>
        <DialogContent className={adminLayout.dialog.sm}>
          <DialogTitle>{'Add required actions'}</DialogTitle>
          <DialogDescription>{'Pick a piece'}</DialogDescription>
          <OpenPicker />
        </DialogContent>
      </Dialog>,
    );
    const list = screen.getByText('Picker list');
    expect(list.closest('[data-slot="dialog-content"]')).toBeNull();
    expect(isHiddenFromReaders(list)).toBe(false);
    expect(isHiddenFromReaders(screen.getByText('Add required actions'))).toBe(
      true,
    );
  });

  it('do the same inside sheets', () => {
    render(
      <Sheet open>
        <SheetContent>
          <SheetTitle>{'Edit'}</SheetTitle>
          <OpenPicker />
        </SheetContent>
      </Sheet>,
    );
    const list = screen.getByText('Picker list');
    expect(list.closest('[data-slot="sheet-content"]')).toBeNull();
    expect(isHiddenFromReaders(screen.getByText('Edit'))).toBe(true);
  });

  it('stay non-modal outside a dialog', () => {
    render(
      <>
        <p>{'Page body'}</p>
        <OpenPicker />
      </>,
    );
    expect(isHiddenFromReaders(screen.getByText('Page body'))).toBe(false);
  });
});

describe('popover portals', () => {
  it('never render into a container that could clip them', () => {
    const offenders = sourceFiles(SRC)
      .filter((file) => !CONTAINER_ALLOWED.has(path.relative(SRC, file)))
      .filter((file) => PORTAL_INTO_CONTAINER.test(readFileSync(file, 'utf8')))
      .map((file) => path.relative(SRC, file));
    expect(offenders).toEqual([]);
  });
});

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const full = path.join(directory, entry);
    if (statSync(full).isDirectory()) {
      return sourceFiles(full);
    }
    return full.endsWith('.tsx') ? [full] : [];
  });
}

const SRC = path.resolve(__dirname, '../../../src');

const PORTAL_INTO_CONTAINER =
  /<(?:Popover|Select|DropdownMenu|DropdownMenuSub|HoverCard|Tooltip|ContextMenu|Menubar)Content\b(?:(?!<\w)[\s\S]){0,600}?\scontainer=/;

const CONTAINER_ALLOWED = new Set([
  'app/builder/flow-canvas/nodes/note-node/note-tools.tsx',
  'components/custom/markdown-input/tools.tsx',
]);

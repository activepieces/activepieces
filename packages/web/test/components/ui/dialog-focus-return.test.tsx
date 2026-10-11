// @vitest-environment jsdom
/* eslint-disable jest-dom/prefer-focus -- @testing-library/jest-dom is not a dependency of packages/web */
/* eslint-disable testing-library/no-node-access -- the menu trigger and toaster are plain DOM nodes mounted outside React */
import { render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet';
import { menuFocusReturn } from '@/hooks/use-menu-focus-return';

function mountMenu() {
  const trigger = document.createElement('button');
  trigger.id = 'row-menu-trigger';
  const menu = document.createElement('div');
  menu.setAttribute('role', 'menu');
  menu.setAttribute('aria-labelledby', trigger.id);
  const item = document.createElement('div');
  item.setAttribute('role', 'menuitem');
  menu.appendChild(item);
  trigger.setAttribute('data-test-host', '');
  menu.setAttribute('data-test-host', '');
  document.body.append(trigger, menu);
  return { trigger, menu, item };
}

function selectItem({ menu, item }: { menu: HTMLElement; item: HTMLElement }) {
  const event = new Event('menu.itemSelect');
  item.dispatchEvent(event);
  Object.defineProperty(event, 'target', { value: item });
  menuFocusReturn.rememberSelection(event);
  menu.remove();
}

function DialogUnderTest({ open }: { open: boolean }) {
  return (
    <Dialog open={open}>
      <DialogContent>
        <DialogTitle>Title</DialogTitle>
        <DialogDescription>Description</DialogDescription>
        <input aria-label="name" />
      </DialogContent>
    </Dialog>
  );
}

function SheetUnderTest({ open }: { open: boolean }) {
  return (
    <Sheet open={open}>
      <SheetContent>
        <SheetTitle>Title</SheetTitle>
        <SheetDescription>Description</SheetDescription>
        <input aria-label="name" />
      </SheetContent>
    </Sheet>
  );
}

afterEach(() => {
  document
    .querySelectorAll('[data-test-host]')
    .forEach((element) => element.remove());
});

describe('focus return to the menu trigger', () => {
  it('focuses the row menu trigger after a dialog opened from it closes', async () => {
    const menu = mountMenu();
    selectItem(menu);
    const { rerender } = render(<DialogUnderTest open />);
    await waitFor(() => expect(document.activeElement).not.toBe(document.body));
    rerender(<DialogUnderTest open={false} />);
    await waitFor(() => expect(document.activeElement).toBe(menu.trigger));
  });

  it('focuses the row menu trigger after a sheet opened from it closes', async () => {
    const menu = mountMenu();
    selectItem(menu);
    const { rerender } = render(<SheetUnderTest open />);
    rerender(<SheetUnderTest open={false} />);
    await waitFor(() => expect(document.activeElement).toBe(menu.trigger));
  });

  it('leaves focus alone when the dialog was not opened from a menu', async () => {
    const { trigger } = mountMenu();
    const { rerender } = render(<DialogUnderTest open />);
    rerender(<DialogUnderTest open={false} />);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(document.activeElement).not.toBe(trigger);
  });
});

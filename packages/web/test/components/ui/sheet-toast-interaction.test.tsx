// @vitest-environment jsdom
/* eslint-disable testing-library/no-node-access -- the menu trigger and toaster are plain DOM nodes mounted outside React */
import { fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet';

function mountOutside({ toaster }: { toaster: boolean }) {
  const host = document.createElement('section');
  host.setAttribute('data-test-host', '');
  if (toaster) {
    host.setAttribute('data-sonner-toaster', '');
  }
  const button = document.createElement('button');
  host.appendChild(button);
  document.body.appendChild(host);
  return button;
}

function renderSheet(onOpenChange: (open: boolean) => void) {
  return render(
    <Sheet open onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetTitle>Title</SheetTitle>
        <SheetDescription>Description</SheetDescription>
      </SheetContent>
    </Sheet>,
  );
}

afterEach(() => {
  document
    .querySelectorAll('[data-test-host]')
    .forEach((element) => element.remove());
});

describe('Sheet outside clicks', () => {
  it('stays open when a toast is clicked', async () => {
    const onOpenChange = vi.fn();
    renderSheet(onOpenChange);
    const toastButton = mountOutside({ toaster: true });
    await new Promise((resolve) => setTimeout(resolve, 10));
    fireEvent.pointerDown(toastButton);
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('closes on any other outside click', async () => {
    const onOpenChange = vi.fn();
    renderSheet(onOpenChange);
    const elsewhere = mountOutside({ toaster: false });
    await new Promise((resolve) => setTimeout(resolve, 10));
    fireEvent.pointerDown(elsewhere);
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });
});

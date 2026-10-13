/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document */
/* eslint-disable testing-library/no-node-access -- the footer slot is a plain DOM node outside the rendered tree */
import { fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { createMemoryRouter, Link, RouterProvider } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({
  t: (key: string) => key,
}));

import { AdminPage, AdminPageFooter } from '@/app/components/admin/admin-page';
import { SaveBar } from '@/app/components/admin/save-bar';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent } from '@/components/ui/popover';

function mountWithRouter(element: React.ReactNode) {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: (
          <>
            {element}
            <Link to="/other">{'Go elsewhere'}</Link>
          </>
        ),
      },
      { path: '/other', element: <p>{'Other page'}</p> },
    ],
    { initialEntries: ['/'] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

function pressSave() {
  const isMac = /(Mac)/i.test(navigator.userAgent);
  fireEvent.keyDown(document, {
    key: 's',
    metaKey: isMac,
    ctrlKey: !isMac,
  });
}

function saveBar(): HTMLElement {
  const bar = document.querySelector<HTMLElement>('[data-slot="save-bar"]');
  if (!bar) {
    throw new Error('save bar not rendered');
  }
  return bar;
}

describe('SaveBar visibility', () => {
  it('stays hidden while nothing has changed', () => {
    render(<SaveBar dirty={false} saving={false} guardNavigation={false} />);
    expect(saveBar().hidden).toBe(true);
  });

  it('shows while there are changes, while saving and after a failed save', () => {
    const { rerender } = render(
      <SaveBar dirty saving={false} guardNavigation={false} />,
    );
    expect(saveBar().hidden).toBe(false);
    rerender(<SaveBar dirty={false} saving guardNavigation={false} />);
    expect(saveBar().hidden).toBe(false);
    rerender(
      <SaveBar
        dirty={false}
        saving={false}
        error="Name is taken"
        guardNavigation={false}
      />,
    );
    expect(saveBar().hidden).toBe(false);
  });

  it('keeps its status and actions visible on a page that always needs them', () => {
    render(
      <SaveBar
        dirty={false}
        saving={false}
        status={<span>{'Step 1 of 2'}</span>}
        guardNavigation={false}
      />,
    );
    expect(saveBar().hidden).toBe(false);
  });
});

describe('SaveBar leave guard', () => {
  it('asks before leaving with unsaved changes', async () => {
    const router = mountWithRouter(
      <SaveBar dirty saving={false} onSave={() => undefined} />,
    );
    fireEvent.click(screen.getByText('Go elsewhere'));
    expect(await screen.findByText('Leave without saving?')).toBeTruthy();
    expect(router.state.location.pathname).toBe('/');
  });

  it('mounts one guard when two save bars are dirty', async () => {
    mountWithRouter(
      <>
        <SaveBar dirty saving={false} onSave={() => undefined} />
        <SaveBar dirty saving={false} onSave={() => undefined} />
      </>,
    );
    fireEvent.click(screen.getByText('Go elsewhere'));
    expect(await screen.findAllByText('Leave without saving?')).toHaveLength(1);
  });
});

describe('SaveBar shortcut', () => {
  it('saves a dirty bar on Cmd/Ctrl+S', () => {
    const onSave = vi.fn();
    mountWithRouter(<SaveBar dirty saving={false} onSave={onSave} />);
    pressSave();
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('does not save while a dialog is open', () => {
    const onSave = vi.fn();
    mountWithRouter(
      <>
        <SaveBar dirty saving={false} onSave={onSave} />
        <Dialog open>
          <DialogContent aria-describedby={undefined}>
            <DialogTitle>{'Delete platform'}</DialogTitle>
          </DialogContent>
        </Dialog>
      </>,
    );
    pressSave();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('does not save when nothing changed or saving is disabled', () => {
    const onSave = vi.fn();
    mountWithRouter(
      <>
        <SaveBar dirty={false} saving={false} onSave={onSave} />
        <SaveBar dirty saving={false} disabled onSave={onSave} />
      </>,
    );
    pressSave();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('saves only the bar in the form that holds focus when two are dirty', () => {
    const first = vi.fn();
    const second = vi.fn();
    mountWithRouter(
      <>
        <form>
          <input aria-label="first field" />
          <SaveBar dirty saving={false} onSave={first} />
        </form>
        <form>
          <input aria-label="second field" />
          <SaveBar dirty saving={false} onSave={second} />
        </form>
      </>,
    );
    screen.getByLabelText('second field').focus();
    pressSave();
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('still saves while a popover is open', () => {
    const onSave = vi.fn();
    mountWithRouter(
      <>
        <SaveBar dirty saving={false} onSave={onSave} />
        <Popover open>
          <PopoverContent>{'Pick a colour'}</PopoverContent>
        </Popover>
      </>,
    );
    pressSave();
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});

describe('AdminPageFooter', () => {
  it('renders its content once, in the page footer', () => {
    render(
      <AdminPage>
        <p>{'Body'}</p>
        <AdminPageFooter>
          <span>{'Footer bar'}</span>
        </AdminPageFooter>
      </AdminPage>,
    );
    const footer = screen.getAllByText('Footer bar');
    expect(footer).toHaveLength(1);
    expect(
      screen
        .getByText('Body')
        .closest('[data-slot="admin-page"]')
        ?.lastElementChild?.contains(footer[0]),
    ).toBe(true);
  });
});

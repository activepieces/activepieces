import { RefObject, useEffect } from 'react';

import { useOptionalTableStore } from '../components/ap-table-state-provider';
import {
  ApTableStore,
  TableState,
} from '../stores/store/ap-tables-client-state';

/**
 * Imperative DOM layer over the RevoGrid element. Two jobs:
 *
 * 1. Realtime "fill" animations (edit flash / row enter / delete disintegrate).
 *    RevoGrid virtualizes rows and recreates cell DOM ~20×/sec during a delta
 *    cascade, so toggling classes on its own cells is racy (flicker / doubles).
 *    Instead we render each animation as a fresh element in a decoupled overlay
 *    appended INTO the grid's scrolling content (so it scrolls with the rows for
 *    free). Each event = exactly one overlay element, animated once and removed —
 *    identical every time, independent of grid re-renders. Driven off the store's
 *    delta highlight state via a synchronous `store.subscribe` (no React churn);
 *    deletes clone the row synchronously, before the store removes it.
 *
 * 2. Cross-viewport row-hover: the frozen row-header gutter and the scrolling body
 *    are separate DOM trees, so CSS `:hover` can't span the logical row — we toggle
 *    `.ap-row-hovered` on every cell sharing the hovered `data-rgRow`.
 */
function useTableGridDom<T extends HTMLElement>(gridRef: RefObject<T | null>) {
  const store = useOptionalTableStore();

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || !store) {
      return;
    }

    let prevRecords = store.getState().recentlyChanged.records;
    let prevCells = store.getState().recentlyChanged.cells;
    let prevExiting = store.getState().exitingRows;

    const unsubscribe = store.subscribe((state) => {
      const nextRecords = state.recentlyChanged.records;
      const nextCells = state.recentlyChanged.cells;
      const nextExiting = state.exitingRows;

      // Deletes are handled synchronously: the row is still in the DOM right now,
      // but the store removes it a frame later.
      forEachNewKey(prevExiting, nextExiting, (recordId) =>
        disintegrateRow(grid, state, recordId),
      );

      forEachNewKey(prevRecords, nextRecords, (recordId) =>
        requestAnimationFrame(() => enterRow(grid, store, recordId)),
      );

      forEachNewKey(prevCells, nextCells, (key) => {
        const sep = key.lastIndexOf('_');
        const recordId = key.slice(0, sep);
        const fieldUuid = key.slice(sep + 1);
        // A freshly-created row plays the full-width sweep — skip the per-cell
        // flash for those so two effects never stack on one row.
        if (nextRecords[recordId] !== undefined) {
          return;
        }
        requestAnimationFrame(() =>
          flashCell(grid, store, recordId, fieldUuid),
        );
      });

      prevRecords = nextRecords;
      prevCells = nextCells;
      prevExiting = nextExiting;
    });

    return () => unsubscribe();
  }, [store, gridRef]);

  // Row selection: applied imperatively (like hover) so toggling a checkbox never
  // touches the grid's source. cellProperties/cellTemplate already re-derive the
  // class + checkbox from the store on (re)render, which covers virtualized rows
  // scrolling into view; this effect covers the already-rendered rows the instant
  // selection changes, when no source change triggers a render.
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || !store) {
      return;
    }
    const applySelection = (selected: ReadonlySet<string>) => {
      const records = store.getState().records;
      grid.querySelectorAll<HTMLElement>('[data-rgrow]').forEach((cell) => {
        const rowAttr = cell.getAttribute('data-rgrow');
        if (rowAttr === null) {
          return;
        }
        const uuid = records[Number(rowAttr)]?.uuid;
        const isSelected = uuid != null && selected.has(uuid);
        cell.classList.toggle('ap-row-selected', isSelected);
        const checkbox = cell.querySelector<HTMLInputElement>('.ap-checkbox');
        if (checkbox) {
          checkbox.checked = isSelected;
        }
      });
      const headerCheckbox = grid.querySelector<HTMLInputElement>(
        '.ap-gutter-header .ap-checkbox',
      );
      if (headerCheckbox) {
        headerCheckbox.checked =
          records.length > 0 && selected.size === records.length;
      }
    };
    let prevSelected = store.getState().selectedRecords;
    applySelection(prevSelected);
    const unsubscribe = store.subscribe((state) => {
      if (state.selectedRecords === prevSelected) {
        return;
      }
      prevSelected = state.selectedRecords;
      applySelection(state.selectedRecords);
    });
    return () => unsubscribe();
  }, [store, gridRef]);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) {
      return;
    }
    let hoveredRow: string | null = null;
    const clear = () => {
      if (hoveredRow === null) {
        return;
      }
      grid
        .querySelectorAll(`[data-rgrow="${hoveredRow}"]`)
        .forEach((el) => el.classList.remove('ap-row-hovered'));
      hoveredRow = null;
    };
    const onMove = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      const cell = target?.closest('[data-rgrow]');
      const rowAttr = cell?.getAttribute('data-rgrow') ?? null;
      if (rowAttr === hoveredRow) {
        return;
      }
      clear();
      if (rowAttr !== null) {
        grid
          .querySelectorAll(`[data-rgrow="${rowAttr}"]`)
          .forEach((el) => el.classList.add('ap-row-hovered'));
        hoveredRow = rowAttr;
      }
    };
    grid.addEventListener('pointermove', onMove);
    grid.addEventListener('pointerleave', clear);
    return () => {
      grid.removeEventListener('pointermove', onMove);
      grid.removeEventListener('pointerleave', clear);
      clear();
    };
  }, [gridRef]);

  // Drag-to-select in the gutter: press on a row's checkbox/number and drag up or
  // down to (de)select a contiguous run, spreadsheet-style. A plain click never
  // moves, so the native checkbox onChange still owns single-row toggles; a real
  // drag releases the pointer off the start checkbox, so it never double-toggles.
  // The selection-sync effect above re-paints checkboxes as the store updates.
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || !store) {
      return;
    }
    let startRow: number | null = null;
    let mode: 'add' | 'remove' = 'add';
    let baseline: ReadonlySet<string> | null = null;
    let dragging = false;

    const gutterRowAt = (clientY: number): number | null => {
      let nearestRow: number | null = null;
      let nearestDist = Number.POSITIVE_INFINITY;
      grid
        .querySelectorAll<HTMLElement>('.ap-gutter-cell[data-rgrow]')
        .forEach((cell) => {
          const rect = cell.getBoundingClientRect();
          const row = Number(cell.getAttribute('data-rgrow'));
          if (clientY >= rect.top && clientY <= rect.bottom) {
            nearestRow = row;
            nearestDist = 0;
          } else if (nearestDist > 0) {
            const dist =
              clientY < rect.top ? rect.top - clientY : clientY - rect.bottom;
            if (dist < nearestDist) {
              nearestDist = dist;
              nearestRow = row;
            }
          }
        });
      return nearestRow;
    };

    const applyRange = (current: number) => {
      if (startRow === null || baseline === null) {
        return;
      }
      const state = store.getState();
      const next = new Set(baseline);
      const lo = Math.min(startRow, current);
      const hi = Math.max(startRow, current);
      for (let row = lo; row <= hi; row++) {
        const uuid = state.records[row]?.uuid;
        if (uuid == null) {
          continue;
        }
        if (mode === 'add') {
          next.add(uuid);
        } else {
          next.delete(uuid);
        }
      }
      state.setSelectedRecords(next);
    };

    const onDown = (event: PointerEvent) => {
      if (event.button !== 0) {
        return;
      }
      const target = event.target as HTMLElement | null;
      const cell = target?.closest<HTMLElement>('.ap-gutter-cell[data-rgrow]');
      if (!cell) {
        return;
      }
      const state = store.getState();
      const row = Number(cell.getAttribute('data-rgrow'));
      const uuid = state.records[row]?.uuid;
      startRow = row;
      baseline = state.selectedRecords;
      mode = uuid != null && state.selectedRecords.has(uuid) ? 'remove' : 'add';
      dragging = false;
    };

    const onMove = (event: PointerEvent) => {
      if (startRow === null) {
        return;
      }
      const row = gutterRowAt(event.clientY);
      if (row === null) {
        return;
      }
      if (!dragging) {
        if (row === startRow) {
          return;
        }
        dragging = true;
        grid.style.userSelect = 'none';
      }
      event.preventDefault();
      applyRange(row);
    };

    const onUp = () => {
      startRow = null;
      baseline = null;
      dragging = false;
      grid.style.userSelect = '';
    };

    grid.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      grid.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      grid.style.userSelect = '';
    };
  }, [store, gridRef]);
}

function forEachNewKey(
  prev: Record<string, number>,
  next: Record<string, number>,
  fn: (key: string) => void,
): void {
  Object.entries(next).forEach(([key, expiry]) => {
    if (prev[key] !== expiry) {
      fn(key);
    }
  });
}

// The center (non-frozen) data viewport's scrolling content; an overlay appended
// here scrolls with the rows for free. The row-header gutter has its own nested
// scroll, excluded by the `>` child combinator.
function centerContent(grid: HTMLElement): HTMLElement | null {
  return grid.querySelector(
    '.viewports > revogr-viewport-scroll .content-wrapper',
  );
}

function fxLayer(content: HTMLElement): HTMLElement {
  let layer = content.querySelector<HTMLElement>(':scope > .ap-fx-layer');
  if (!layer) {
    if (!content.style.position) {
      content.style.position = 'relative';
    }
    layer = document.createElement('div');
    layer.className = 'ap-fx-layer';
    content.appendChild(layer);
  }
  return layer;
}

type Box = { x: number; y: number; w: number; h: number };

function contentBox(content: HTMLElement, el: HTMLElement): Box {
  const c = content.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  return { x: r.left - c.left, y: r.top - c.top, w: r.width, h: r.height };
}

function spawn(layer: HTMLElement, className: string, box: Box): HTMLElement {
  const el = document.createElement('div');
  el.className = className;
  el.style.left = `${box.x}px`;
  el.style.top = `${box.y}px`;
  el.style.width = `${box.w}px`;
  el.style.height = `${box.h}px`;
  layer.appendChild(el);
  el.addEventListener('animationend', () => el.remove(), { once: true });
  return el;
}

function rowIndexOf(store: ApTableStore, recordId: string): number {
  return store.getState().records.findIndex((r) => r.recordId === recordId);
}

function flashCell(
  grid: HTMLElement,
  store: ApTableStore,
  recordId: string,
  fieldUuid: string,
): void {
  const content = centerContent(grid);
  if (!content) {
    return;
  }
  const rowIndex = rowIndexOf(store, recordId);
  const colIndex = store
    .getState()
    .fields.findIndex((f) => f.uuid === fieldUuid);
  if (rowIndex < 0 || colIndex < 0) {
    return;
  }
  const cell = content.querySelector<HTMLElement>(
    `.rgCell[data-rgrow="${rowIndex}"][data-rgcol="${colIndex}"]`,
  );
  if (!cell) {
    return;
  }
  spawn(fxLayer(content), 'ap-fx ap-fx-flash', contentBox(content, cell));
}

function enterRow(
  grid: HTMLElement,
  store: ApTableStore,
  recordId: string,
): void {
  const content = centerContent(grid);
  if (!content) {
    return;
  }
  const rowIndex = rowIndexOf(store, recordId);
  if (rowIndex < 0) {
    return;
  }
  const row = content.querySelector<HTMLElement>(
    `.rgRow[data-rgrow="${rowIndex}"]`,
  );
  if (!row) {
    return;
  }
  const box = contentBox(content, row);
  spawn(fxLayer(content), 'ap-fx ap-fx-enter', {
    x: 0,
    y: box.y,
    w: Math.max(box.w, content.clientWidth),
    h: box.h,
  });
}

function disintegrateRow(
  grid: HTMLElement,
  state: TableState,
  recordId: string,
): void {
  const content = centerContent(grid);
  if (!content) {
    return;
  }
  const rowIndex = state.records.findIndex((r) => r.recordId === recordId);
  if (rowIndex < 0) {
    return;
  }
  const row = content.querySelector<HTMLElement>(
    `.rgRow[data-rgrow="${rowIndex}"]`,
  );
  if (!row) {
    return;
  }
  const box = contentBox(content, row);
  const ghost = spawn(fxLayer(content), 'ap-fx ap-fx-ghost', box);
  const clone = row.cloneNode(true) as HTMLElement;
  clone.style.transform = 'none';
  clone.style.position = 'absolute';
  clone.style.left = '0';
  clone.style.top = '0';
  clone.style.width = `${box.w}px`;
  ghost.appendChild(clone);
}

export { useTableGridDom };

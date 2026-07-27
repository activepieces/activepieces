// A single interactive element as surfaced by the snapshot.
export interface SnapshotElement {
  ref: number;
  tag: string;
  role: string;
  text: string;
}

// Injected into the cloud browser via POST /session/{id}/execute/sync.
// It re-tags every visible, interactive, non-occluded element with
// data-ref="N" and returns [{ ref, tag, role, text }] so downstream actions
// can address elements by a stable numeric ref instead of brittle selectors.
//
// NOTE: the `\\s+` below is intentional — this whole thing is a string that is
// executed *inside the browser*, where it must read as the regex /\s+/g.
export const SNAPSHOT_SCRIPT = `
	const SELECTOR = 'a, button, input, textarea, select, [role="button"], [role="link"], [role="tab"], [role="menuitem"], [role="checkbox"], [role="radio"], [tabindex="0"]';
	document.querySelectorAll('[data-ref]').forEach((el) => el.removeAttribute('data-ref'));
	const out = [];
	let nextRef = 1;
	for (const el of document.querySelectorAll(SELECTOR)) {
		const tag = el.tagName.toLowerCase();
		const inputType = (el.getAttribute('type') || '').toLowerCase();
		const isDisabled = ('disabled' in el && el.disabled) || el.getAttribute('aria-disabled') === 'true';
		const isHidden = el.getAttribute('aria-hidden') === 'true' || el.hidden || (tag === 'input' && inputType === 'hidden');
		if (isDisabled || isHidden) continue;
		const rect = el.getBoundingClientRect();
		if (rect.width <= 0 || rect.height <= 0) continue;
		const cx = rect.left + rect.width / 2;
		const cy = rect.top + rect.height / 2;
		const inViewport = cy >= 0 && cy < window.innerHeight && cx >= 0 && cx < window.innerWidth;
		if (inViewport) {
			const top = document.elementFromPoint(cx, cy);
			if (top && !(top === el || el.contains(top) || top.contains(el))) continue;
		}
		const isReadOnly = 'readOnly' in el && el.readOnly;
		const baseRole = el.getAttribute('role') || tag;
		const role = isReadOnly ? baseRole + ' (readonly)' : baseRole;
		const text = (
			el.innerText ||
			el.value ||
			el.placeholder ||
			el.getAttribute('aria-label') ||
			el.getAttribute('title') ||
			''
		).replace(/\\s+/g, ' ').trim().slice(0, 120);
		const ref = nextRef++;
		el.setAttribute('data-ref', String(ref));
		out.push({ ref, tag, role, text });
	}
	return out;
`;

// CSS selector that resolves a ref number back to its tagged element.
export function refSelector(ref: number): string {
  return `[data-ref="${ref}"]`;
}

// Turns the raw snapshot array into a compact, human/LLM-readable listing.
export function formatSnapshot(elements: SnapshotElement[] = []): string {
  if (!elements.length) {
    return '(no interactive elements found)';
  }
  return elements
    .map((el) => `${el.ref}. <${el.tag}> [${el.role}] ${el.text}`)
    .join('\n');
}

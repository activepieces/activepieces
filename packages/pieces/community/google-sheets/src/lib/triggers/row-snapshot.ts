import crypto from 'crypto';
import * as z from 'zod/mini';
import { isNil, Store, tryCatch } from '@activepieces/pieces-framework';
import { SheetCellValue } from './helpers';

const FINGERPRINT_LENGTH = 16;
const ROWS_PER_CHUNK = 8000;
const SNAPSHOT_VERSION = 2;
const MAX_ORPHAN_CHUNKS = 64;
const MAX_LOAD_ATTEMPTS = 3;
const WRITE_ID_BYTES = 4;

const manifestSchema = z.object({
	version: z.literal(SNAPSHOT_VERSION),
	spreadsheetId: z.string(),
	sheetId: z.number(),
	triggerColumn: z.string(),
	generation: z.number(),
	writeId: z.string(),
	chunkCount: z.number(),
	rowCount: z.number(),
	entryWidth: z.number(),
	readAt: z.optional(z.number()),
	retained: z.optional(
		z.object({
			generation: z.number(),
			writeId: z.string(),
			chunkCount: z.number(),
			rowCount: z.number(),
			entryWidth: z.number(),
		}),
	),
});

function fingerprint(value: unknown): string {
	return crypto
		.createHash('sha256')
		.update(JSON.stringify(value))
		.digest('hex')
		.slice(0, FINGERPRINT_LENGTH);
}

const EMPTY_FINGERPRINT = fingerprint([]);

function isBlankCell(value: SheetCellValue): boolean {
	return isNil(value) || value === '';
}

function normalizeRow(row: SheetCellValue[] | undefined): SheetCellValue[] {
	const cells = (row ?? []).map((cell) => (isNil(cell) ? '' : cell));
	let end = cells.length;
	while (end > 0 && isBlankCell(cells[end - 1])) {
		end -= 1;
	}
	return cells.slice(0, end);
}

function fingerprintRows({
	rows,
	triggerColumnIndex,
}: {
	rows: SheetCellValue[][];
	triggerColumnIndex: number | undefined;
}): RowFingerprint[] {
	return rows.map((row) => {
		const normalized = normalizeRow(row);
		const full = fingerprint(normalized);
		if (isNil(triggerColumnIndex)) {
			return { full, trigger: full };
		}
		const cell = normalized[triggerColumnIndex];
		return { full, trigger: isBlankCell(cell) ? EMPTY_FINGERPRINT : fingerprint([cell]) };
	});
}

function fingerprintRowsByFirstCell({ rows }: { rows: SheetCellValue[][] }): RowFingerprint[] {
	return rows.map((row) => {
		const normalized = normalizeRow(row);
		const firstFilled = normalized.findIndex((cell) => !isBlankCell(cell));
		return {
			full: fingerprint(normalized),
			trigger: firstFilled === -1 ? EMPTY_FINGERPRINT : fingerprint([firstFilled, normalized[firstFilled]]),
		};
	});
}

function sameRows({ previous, current }: { previous: RowFingerprint[]; current: RowFingerprint[] }): boolean {
	return (
		previous.length === current.length &&
		previous.every((row, index) => row.full === current[index].full && row.trigger === current[index].trigger)
	);
}

function isEmptyRow(row: RowFingerprint): boolean {
	return row.full === EMPTY_FINGERPRINT;
}

function hasBlankTrigger(row: RowFingerprint): boolean {
	return row.trigger === EMPTY_FINGERPRINT;
}

function diffRows({
	previous,
	current,
	pairMovedRowsByTrigger = false,
}: {
	previous: RowFingerprint[];
	current: RowFingerprint[];
	pairMovedRowsByTrigger?: boolean;
}): RowDiff {
	const currentMatched = current.map(() => false);
	const previousTarget = previous.map(() => -1);

	const overlap = Math.min(previous.length, current.length);
	for (let index = 0; index < overlap; index++) {
		if (previous[index].full === current[index].full && !isEmptyRow(current[index])) {
			currentMatched[index] = true;
			previousTarget[index] = index;
		}
	}

	const pool = new Map<string, number[]>();
	previous.forEach((row, index) => {
		if (previousTarget[index] !== -1 || isEmptyRow(row)) {
			return;
		}
		const bucket = pool.get(row.full) ?? [];
		bucket.push(index);
		pool.set(row.full, bucket);
	});
	const poolCursor = new Map<string, number>();
	current.forEach((row, index) => {
		if (currentMatched[index] || isEmptyRow(row)) {
			return;
		}
		const bucket = pool.get(row.full);
		const cursor = poolCursor.get(row.full) ?? 0;
		if (isNil(bucket) || cursor >= bucket.length) {
			return;
		}
		poolCursor.set(row.full, cursor + 1);
		currentMatched[index] = true;
		previousTarget[bucket[cursor]] = index;
	});

	const previousByGap = new Map<number, number[]>();
	let previousAnchor = -1;
	previous.forEach((_row, index) => {
		if (previousTarget[index] !== -1) {
			previousAnchor = previousTarget[index];
			return;
		}
		const gap = previousByGap.get(previousAnchor) ?? [];
		gap.push(index);
		previousByGap.set(previousAnchor, gap);
	});

	const currentByGap = new Map<number, number[]>();
	let currentAnchor = -1;
	current.forEach((_row, index) => {
		if (currentMatched[index]) {
			currentAnchor = index;
			return;
		}
		const gap = currentByGap.get(currentAnchor) ?? [];
		gap.push(index);
		currentByGap.set(currentAnchor, gap);
	});

	const previousPaired = previous.map((_row, index) => previousTarget[index] !== -1);
	const blankMatched = current.map(() => false);
	const paired: RowChange[] = [];
	currentByGap.forEach((currentGap, anchor) => {
		const previousGap = previousByGap.get(anchor) ?? [];
		const { usedPrevious, usedCurrent } = matchBlankRows({
			previousBlanks: previousGap.filter((index) => isEmptyRow(previous[index])),
			currentBlanks: currentGap.filter((index) => isEmptyRow(current[index])),
		});
		usedPrevious.forEach((index) => {
			previousPaired[index] = true;
		});
		usedCurrent.forEach((index) => {
			blankMatched[index] = true;
		});
		const previousLeft = previousGap.filter((index) => !usedPrevious.has(index));
		const currentLeft = currentGap.filter((index) => !usedCurrent.has(index));
		currentLeft.forEach((index, position) => {
			const previousIndex = previousLeft[position];
			if (isNil(previousIndex)) {
				paired.push({ index, kind: 'new', current: current[index], previous: undefined });
				return;
			}
			previousPaired[previousIndex] = true;
			paired.push({ index, kind: 'edited', current: current[index], previous: previous[previousIndex] });
		});
	});
	paired.sort((left, right) => left.index - right.index);

	const changes = pairMovedRowsByTrigger
		? pairMovedRows({ changes: paired, previous, previousPaired })
		: paired;
	const lastKnownIndex = current.reduce(
		(last, _row, index) => (currentMatched[index] || blankMatched[index] ? Math.max(last, index) : last),
		changes.reduce((last, change) => (change.kind === 'edited' ? Math.max(last, change.index) : last), -1),
	);

	return { changes, lastKnownIndex };
}

function matchBlankRows({
	previousBlanks,
	currentBlanks,
}: {
	previousBlanks: number[];
	currentBlanks: number[];
}): { usedPrevious: Set<number>; usedCurrent: Set<number> } {
	const previousSet = new Set(previousBlanks);
	const samePosition = new Set(currentBlanks.filter((index) => previousSet.has(index)));
	const previousRest = previousBlanks.filter((index) => !samePosition.has(index));
	const currentRest = currentBlanks.filter((index) => !samePosition.has(index));
	const restPairs = Math.min(previousRest.length, currentRest.length);
	return {
		usedPrevious: new Set([...samePosition, ...previousRest.slice(0, restPairs)]),
		usedCurrent: new Set([...samePosition, ...currentRest.slice(0, restPairs)]),
	};
}

function pairMovedRows({
	changes,
	previous,
	previousPaired,
}: {
	changes: RowChange[];
	previous: RowFingerprint[];
	previousPaired: boolean[];
}): RowChange[] {
	const leftovers = new Map<string, number[]>();
	previous.forEach((row, index) => {
		if (previousPaired[index] || isEmptyRow(row) || hasBlankTrigger(row)) {
			return;
		}
		const bucket = leftovers.get(row.trigger) ?? [];
		bucket.push(index);
		leftovers.set(row.trigger, bucket);
	});
	const cursors = new Map<string, number>();
	return changes.map((change) => {
		if (change.kind !== 'new' || isEmptyRow(change.current)) {
			return change;
		}
		const bucket = leftovers.get(change.current.trigger);
		const cursor = cursors.get(change.current.trigger) ?? 0;
		if (isNil(bucket) || cursor >= bucket.length) {
			return change;
		}
		cursors.set(change.current.trigger, cursor + 1);
		return { ...change, kind: 'edited', previous: previous[bucket[cursor]] };
	});
}

function chunkKey({ key, generation, chunk }: { key: string; generation: number; chunk: number }): string {
	return `${key}_g${generation}_${chunk}`;
}

async function readManifest({ store, key }: { store: Store; key: string }): Promise<SnapshotManifest | null> {
	const raw = await store.get<unknown>(key);
	if (isNil(raw)) {
		return null;
	}
	const parsed = manifestSchema.safeParse(raw);
	return parsed.success ? parsed.data : null;
}

async function loadSnapshot({
	store,
	key,
	identity,
}: {
	store: Store;
	key: string;
	identity: SnapshotIdentity;
}): Promise<LoadedSnapshot | null> {
	let manifest = await readManifest({ store, key });
	for (let attempt = 1; attempt <= MAX_LOAD_ATTEMPTS; attempt++) {
		if (isNil(manifest) || !matchesIdentity({ manifest, identity })) {
			return null;
		}
		const rows = await readChunks({ store, key, written: manifest });
		if (!isNil(rows)) {
			return { rows, generation: manifest.generation, writeId: manifest.writeId, comparedWriteId: manifest.writeId };
		}
		const latest = await readManifest({ store, key });
		if (isNil(latest) || isSameWrite({ left: latest, right: manifest })) {
			const retained = isNil(manifest.retained)
				? null
				: await readChunks({ store, key, written: manifest.retained });
			if (!isNil(retained) && !isNil(manifest.retained)) {
				console.warn(
					`[google-sheets] row snapshot ${key} generation ${manifest.generation} was overwritten by an overlapping notification; comparing against generation ${manifest.retained.generation}.`,
				);
				return {
					rows: retained,
					generation: manifest.generation,
					writeId: manifest.writeId,
					comparedWriteId: manifest.retained.writeId,
				};
			}
			console.warn(
				`[google-sheets] row snapshot ${key} generation ${manifest.generation} is incomplete; taking a new baseline.`,
			);
			return null;
		}
		manifest = latest;
	}
	throw new Error(
		'The row snapshot kept changing while it was read, because notifications overlapped. Nothing was skipped; the next notification will compare again.',
	);
}

async function saveSnapshotIfNewer({
	store,
	key,
	identity,
	rows,
	loaded,
	readAt,
}: {
	store: Store;
	key: string;
	identity: SnapshotIdentity;
	rows: RowFingerprint[];
	loaded: LoadedSnapshot | null;
	readAt: number;
}): Promise<boolean> {
	const latest = await readManifest({ store, key });
	const nobodySaved =
		isNil(latest) ||
		!matchesIdentity({ manifest: latest, identity }) ||
		(!isNil(loaded) && latest.generation === loaded.generation && latest.writeId === loaded.writeId);
	const storedReadAt = latest?.readAt;
	if (!nobodySaved && !isNil(storedReadAt) && storedReadAt >= readAt) {
		console.info(
			`[google-sheets] row snapshot ${key} was already saved from a newer read by an overlapping notification; keeping it.`,
		);
		return false;
	}
	await saveSnapshot({ store, key, identity, rows, readAt });
	return true;
}

function readTimestamp(): number {
	return performance.timeOrigin + performance.now();
}

function isSameWrite({ left, right }: { left: SnapshotManifest; right: SnapshotManifest }): boolean {
	return left.generation === right.generation && left.writeId === right.writeId;
}

function matchesIdentity({ manifest, identity }: { manifest: SnapshotManifest; identity: SnapshotIdentity }): boolean {
	return (
		manifest.spreadsheetId === identity.spreadsheetId &&
		manifest.sheetId === identity.sheetId &&
		manifest.triggerColumn === identity.triggerColumn
	);
}

async function readChunks({
	store,
	key,
	written,
}: {
	store: Store;
	key: string;
	written: WrittenSnapshot;
}): Promise<RowFingerprint[] | null> {
	const rows: RowFingerprint[] = [];
	for (let chunk = 0; chunk < written.chunkCount; chunk++) {
		const stored = await store.get<unknown>(chunkKey({ key, generation: written.generation, chunk }));
		if (typeof stored !== 'string' || !stored.startsWith(written.writeId)) {
			return null;
		}
		const encoded = stored.slice(written.writeId.length);
		if (encoded.length % written.entryWidth !== 0) {
			return null;
		}
		for (let offset = 0; offset < encoded.length; offset += written.entryWidth) {
			const full = encoded.slice(offset, offset + FINGERPRINT_LENGTH);
			const trigger =
				written.entryWidth > FINGERPRINT_LENGTH
					? encoded.slice(offset + FINGERPRINT_LENGTH, offset + written.entryWidth)
					: full;
			rows.push({ full, trigger });
		}
	}
	return rows.length === written.rowCount ? rows : null;
}

async function saveSnapshot({
	store,
	key,
	identity,
	rows,
	readAt,
}: {
	store: Store;
	key: string;
	identity: SnapshotIdentity;
	rows: RowFingerprint[];
	readAt: number;
}): Promise<void> {
	const previous = await readManifest({ store, key });
	const generation = (previous?.generation ?? 0) + 1;
	const writeId = crypto.randomBytes(WRITE_ID_BYTES).toString('hex');
	const separateTrigger = rows.some((row) => row.trigger !== row.full);
	const entryWidth = separateTrigger ? FINGERPRINT_LENGTH * 2 : FINGERPRINT_LENGTH;
	const chunkCount = Math.ceil(rows.length / ROWS_PER_CHUNK);
	for (let chunk = 0; chunk < chunkCount; chunk++) {
		const encoded = rows
			.slice(chunk * ROWS_PER_CHUNK, (chunk + 1) * ROWS_PER_CHUNK)
			.map((row) => (separateTrigger ? row.full + row.trigger : row.full))
			.join('');
		await store.put(chunkKey({ key, generation, chunk }), writeId + encoded);
	}
	const manifest: SnapshotManifest = {
		version: SNAPSHOT_VERSION,
		spreadsheetId: identity.spreadsheetId,
		sheetId: identity.sheetId,
		triggerColumn: identity.triggerColumn,
		generation,
		writeId,
		chunkCount,
		rowCount: rows.length,
		entryWidth,
		readAt,
		retained: isNil(previous)
			? undefined
			: {
					generation: previous.generation,
					writeId: previous.writeId,
					chunkCount: previous.chunkCount,
					rowCount: previous.rowCount,
					entryWidth: previous.entryWidth,
				},
	};
	await store.put(key, manifest);
	const expired = previous?.retained;
	if (!isNil(expired) && expired.generation !== generation) {
		for (let chunk = 0; chunk < expired.chunkCount; chunk++) {
			await deleteChunk({ store, chunk: chunkKey({ key, generation: expired.generation, chunk }) });
		}
	}
	await deleteOrphanChunks({ store, key, generation, from: chunkCount, upTo: chunkCount + MAX_ORPHAN_CHUNKS });
}

async function deleteChunk({ store, chunk }: { store: Store; chunk: string }): Promise<void> {
	const removed = await tryCatch(() => store.delete(chunk));
	if (removed.error) {
		console.warn(`[google-sheets] could not delete stale row snapshot chunk ${chunk}`, removed.error);
	}
}

async function deleteOrphanChunks({
	store,
	key,
	generation,
	from,
	upTo,
}: {
	store: Store;
	key: string;
	generation: number;
	from: number;
	upTo: number;
}): Promise<void> {
	for (let chunk = from; chunk < upTo; chunk++) {
		const orphan = chunkKey({ key, generation, chunk });
		const existing = await tryCatch(() => store.get<unknown>(orphan));
		if (existing.error || isNil(existing.data)) {
			return;
		}
		await deleteChunk({ store, chunk: orphan });
	}
}

export const rowSnapshot = {
	fingerprintRows,
	fingerprintRowsByFirstCell,
	diffRows,
	sameRows,
	isEmptyRow,
	hasBlankTrigger,
	loadSnapshot,
	saveSnapshot,
	saveSnapshotIfNewer,
	readTimestamp,
};

export type RowFingerprint = {
	full: string;
	trigger: string;
};

export type RowChange = {
	index: number;
	kind: 'new' | 'edited';
	current: RowFingerprint;
	previous: RowFingerprint | undefined;
};

export type RowDiff = {
	changes: RowChange[];
	lastKnownIndex: number;
};

export type SnapshotIdentity = {
	spreadsheetId: string;
	sheetId: number;
	triggerColumn: string;
};

export type LoadedSnapshot = {
	rows: RowFingerprint[];
	generation: number;
	writeId: string;
	comparedWriteId: string;
};

type SnapshotManifest = z.infer<typeof manifestSchema>;

type WrittenSnapshot = Pick<SnapshotManifest, 'generation' | 'writeId' | 'chunkCount' | 'rowCount' | 'entryWidth'>;

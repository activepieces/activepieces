import { isRecord } from './client';

type Json = Record<string, unknown>;

const text = (value: unknown): string | null =>
	typeof value === 'string' && value !== '' ? value : null;

const num = (value: unknown): number | null => (typeof value === 'number' ? value : null);

/** Arrays of strings become "a, b, c" so every value is a plain cell in Tables and Sheets. */
const joined = (value: unknown): string | null => {
	if (!Array.isArray(value)) return text(value);
	const items = value.map((v) => String(v)).filter(Boolean);
	return items.length > 0 ? items.join(', ') : null;
};

const asRecords = (value: unknown): Json[] => (Array.isArray(value) ? value.filter(isRecord) : []);

const link = (record: Json, type: string): string | null =>
	text(asRecords(record['links']).find((l) => l['type'] === type)?.['url']);

/** "Name (House)", the way a person would list them. */
const labelled = (entries: Json[]): string | null => {
	const labels = entries.map((e) => {
		const name = text(e['name']);
		const house = text(e['house']);
		return name && house ? `${name} (${house})` : name;
	});
	return joined(labels.filter(Boolean));
};

/** One perfume as a flat record. Every key is always present (null when the API has no value). */
export function flattenPerfume(p: Json): Json {
	const pyramid = isRecord(p['pyramid']) ? p['pyramid'] : {};
	return {
		id: text(p['id']),
		name: text(p['name']),
		house: text(p['house']),
		year: num(p['year']),
		gender: text(p['gender']),
		family: text(p['family']),
		concentration: text(p['concentration']),
		accords: joined(p['accords']),
		key_notes: joined(p['key_notes']),
		top_notes: joined(pyramid['top']),
		heart_notes: joined(pyramid['heart']),
		base_notes: joined(pyramid['base']),
		character: text(p['character']),
		seasons: joined(p['seasons']),
		occasions: joined(p['occasions']),
		styles: joined(p['styles']),
		longevity: num(p['longevity']),
		projection: num(p['projection']),
		perfumers: joined(p['perfumers']),
		url: link(p, 'try'),
		guide_url: link(p, 'guide'),
		note_url: link(p, 'note'),
	};
}

export const flattenPerfumes = (value: unknown): Json[] => asRecords(value).map(flattenPerfume);

/** Search / similar results: `results[]` entries are a perfume, or {perfume, closeness, why, ...}. */
export function flattenSimilar(entry: Json): Json {
	const perfume = isRecord(entry['perfume']) ? entry['perfume'] : {};
	return {
		...flattenPerfume(perfume),
		closeness: text(entry['closeness']),
		why: text(entry['why']),
		shared_notes: joined(entry['shared_notes']),
		shared_accords: joined(entry['shared_accords']),
	};
}

export function flattenAlternative(entry: Json, originalName: string | null): Json {
	return {
		original: originalName,
		id: text(entry['id']),
		name: text(entry['name']),
		house: text(entry['house']),
		closeness: text(entry['closeness']),
		why: text(entry['why']),
		source: text(entry['source']),
	};
}

export function flattenGetPerfume(body: Json): Json {
	const found = body['found'] === true;
	const perfume = isRecord(body['perfume']) ? body['perfume'] : {};
	const house = isRecord(body['house_info']) ? body['house_info'] : {};
	return {
		found,
		exact_match: body['exact'] === true,
		...flattenPerfume(perfume),
		house_country: text(house['country']),
		house_type: text(house['type']),
		house_style: text(house['style']),
		similar_perfumes: labelled(asRecords(body['similar'])),
		alternatives: labelled(asRecords(body['alternatives'])),
		guide_titles: joined(asRecords(body['guides']).map((g) => g['title'])),
		guide_urls: joined(asRecords(body['guides']).map((g) => g['url'])),
		suggestions: labelled(asRecords(body['suggestions'])),
		message: text(body['message']),
	};
}

export function flattenNote(body: Json): Json {
	const note = isRecord(body['note']) ? body['note'] : {};
	return {
		found: body['found'] === true,
		id: text(note['id']),
		name: text(note['name']),
		family: text(note['family']),
		origin: text(note['origin']),
		smells_like: text(note['smells_like']),
		mood: text(note['mood']),
		also_called: joined(note['also_called']),
		pairs_with: joined(note['pairs_with']),
		similar_notes: joined(note['similar_notes']),
		famous_perfumes: labelled(asRecords(body['famous_perfumes'])),
		note_url: link(body, 'note'),
		guide_url: link(body, 'guide'),
		url: link(body, 'try'),
		suggestions: joined(asRecords(body['suggestions']).map((s) => s['name'] ?? s['id'])),
		message: text(body['message']),
	};
}

export function flattenHouse(entry: Json): Json {
	return {
		id: text(entry['id']),
		name: text(entry['name']),
		country: text(entry['country']),
		type: text(entry['type']),
		founded: num(entry['founded']),
		perfumes_in_index: num(entry['perfumes_in_index']),
		known_for: joined(entry['known_for']),
		style: text(entry['style']),
		aliases: joined(entry['aliases']),
	};
}

export function flattenGetHouse(body: Json): Json {
	const house = isRecord(body['house']) ? body['house'] : {};
	return {
		found: body['found'] === true,
		...flattenHouse(house),
		signature_perfumes: labelled(asRecords(body['signature_perfumes'])),
		url: link(body, 'try'),
		guide_url: link(body, 'guide'),
		suggestions: joined(asRecords(body['suggestions']).map((s) => s['name'] ?? s['id'])),
		message: text(body['message']),
	};
}

export function flattenGuide(entry: Json): Json {
	return {
		title: text(entry['title']),
		type: text(entry['type']),
		topics: joined(entry['topics']),
		url: text(entry['url']),
		translated: typeof entry['translated'] === 'boolean' ? entry['translated'] : null,
	};
}

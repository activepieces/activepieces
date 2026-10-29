import { NinjaPipeRecord } from './client';

function toStages(value: unknown): NinjaPipeRecord[] {
  const list = Array.isArray(value) ? value : [];
  const stages = list.map((stage, index) => {
    const record = typeof stage === 'object' && stage !== null ? Object.fromEntries(Object.entries(stage)) : {};
    const name = typeof record['name'] === 'string' ? record['name'].trim() : '';
    if (name === '') throw new Error(`Stage ${index + 1} needs a name.`);
    const id = typeof record['id'] === 'string' && record['id'].trim() !== '' ? record['id'].trim() : slug({ name, index });
    const color = typeof record['color'] === 'string' && record['color'].trim() !== '' ? record['color'].trim() : DEFAULT_COLORS[index % DEFAULT_COLORS.length];
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) throw new Error(`Stage "${name}" color must be a hex value like #3b82f6.`);
    return { id, name, color };
  });
  if (stages.length === 0) throw new Error('Add at least one stage.');
  const ids = stages.map((stage) => stage.id);
  if (new Set(ids).size !== ids.length) throw new Error('Stage IDs must be unique.');
  return stages;
}

function slug({ name, index }: { name: string; index: number }): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return base === '' ? `stage-${index + 1}` : base;
}

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#059669'];

export const ninjapipePipelines = { toStages };

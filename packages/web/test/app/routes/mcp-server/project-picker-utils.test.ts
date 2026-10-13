import { ProjectType } from '@activepieces/shared';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/projects', () => ({
  getProjectName: ({ displayName }: { displayName: string }) => displayName,
}));

const { projectPickerUtils } = await import(
  '@/app/routes/mcp-server/project-picker-utils'
);

function project(
  id: string,
  displayName: string,
  externalId: string | null = null,
) {
  return { id, displayName, type: ProjectType.TEAM, externalId };
}

const PROJECTS = [
  project('p1', 'Marketing'),
  project('p2', 'Sales Ops'),
  project('p3', 'Engineering'),
  project('p4', 'Marketing EMEA'),
];

describe('projectPickerUtils.filter', () => {
  it('matches the search anywhere in the name, ignoring case', () => {
    const { visible, total } = projectPickerUtils.filter({
      projects: PROJECTS,
      search: ' market ',
      selectedId: null,
      limit: 50,
    });
    expect(visible.map((item) => item.id)).toEqual(['p1', 'p4']);
    expect(total).toBe(2);
  });

  it('caps the list and reports the full match count', () => {
    const many = Array.from({ length: 1200 }, (_, index) =>
      project(`id-${index}`, `Project ${index}`),
    );
    const { visible, total } = projectPickerUtils.filter({
      projects: many,
      search: '',
      selectedId: null,
      limit: 50,
    });
    expect(visible).toHaveLength(50);
    expect(total).toBe(1200);
  });

  it('keeps the selected project first so it stays visible', () => {
    const { visible } = projectPickerUtils.filter({
      projects: PROJECTS,
      search: '',
      selectedId: 'p3',
      limit: 2,
    });
    expect(visible.map((item) => item.id)).toEqual(['p3', 'p1']);
  });

  it('returns nothing when no project matches', () => {
    expect(
      projectPickerUtils.filter({
        projects: PROJECTS,
        search: 'finance',
        selectedId: null,
        limit: 50,
      }),
    ).toEqual({ visible: [], total: 0 });
  });

  it('matches the project id and external id, so same-named projects stay reachable', () => {
    const twins = Array.from({ length: 80 }, (_, index) =>
      project(`twin-${index}`, 'Acme', `acme-${index}`),
    );
    expect(
      projectPickerUtils
        .filter({
          projects: twins,
          search: 'acme-73',
          selectedId: null,
          limit: 50,
        })
        .visible.map((item) => item.id),
    ).toEqual(['twin-73']);
    expect(
      projectPickerUtils
        .filter({
          projects: twins,
          search: 'twin-61',
          selectedId: null,
          limit: 50,
        })
        .visible.map((item) => item.id),
    ).toEqual(['twin-61']);
  });

  it('flags names shared by more than one visible project', () => {
    expect(
      projectPickerUtils.duplicateNames([
        project('a', 'Acme'),
        project('b', 'Acme'),
        project('c', 'Beta'),
      ]),
    ).toEqual(new Set(['Acme']));
  });
});

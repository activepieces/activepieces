import { ProjectType } from '@activepieces/shared';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/projects', () => ({
  getProjectName: ({ displayName }: { displayName: string }) => displayName,
}));

const { projectPickerUtils } = await import(
  '@/app/routes/mcp-server/project-picker-utils'
);

function project(id: string, displayName: string) {
  return { id, displayName, type: ProjectType.TEAM };
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
});

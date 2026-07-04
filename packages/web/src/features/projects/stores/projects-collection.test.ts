// @vitest-environment jsdom
import { PiecesFilterType, ProjectType } from '@activepieces/shared';
import type { ProjectWithLimits } from '@activepieces/shared';
import {
  and,
  createCollection,
  createLiveQueryCollection,
  eq,
  like,
  localOnlyCollectionOptions,
  or,
} from '@tanstack/react-db';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: {
    switchToProject: vi.fn(),
    getCurrentUserId: vi.fn().mockReturnValue('userCurrent'),
    getProjectId: vi.fn().mockReturnValue('proj1'),
  },
}));

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

vi.mock('@tanstack/query-db-collection', () => ({
  queryCollectionOptions: vi.fn().mockReturnValue({
    getKey: (item: ProjectWithLimits) => item.id,
    sync: { sync: () => () => {}, getSyncMetadata: () => ({}) },
    startSync: false,
    gcTime: 0,
  }),
}));

const CURRENT_USER_ID = 'userCurrent';
const OTHER_USER_ID = 'userOther';

function makeProject(
  id: string,
  type: ProjectType,
  ownerId: string,
  displayName = `Project ${id}`,
): ProjectWithLimits {
  return {
    id,
    created: '2024-01-01T00:00:00.000Z',
    updated: '2024-01-01T00:00:00.000Z',
    type,
    ownerId,
    displayName,
    platformId: 'platform1',
    maxConcurrentJobs: null,
    icon: { color: 'BLUE' as never },
    externalId: null,
    releasesEnabled: false,
    metadata: null,
    plan: {
      id: `plan${id}`,
      created: '2024-01-01T00:00:00.000Z',
      updated: '2024-01-01T00:00:00.000Z',
      projectId: id,
      locked: false,
      name: 'default',
      piecesFilterType: PiecesFilterType.NONE,
      pieces: [],
    },
    analytics: {
      totalUsers: 0,
      activeUsers: 0,
      totalFlows: 0,
      activeFlows: 0,
    },
  };
}

function makeSource(projects: ProjectWithLimits[]) {
  return createCollection(
    localOnlyCollectionOptions({
      getKey: (item: ProjectWithLimits) => item.id,
      initialData: projects,
    }),
  );
}

function idsFrom(
  collection: ReturnType<typeof createLiveQueryCollection>,
): string[] {
  return ([...collection.values()] as ProjectWithLimits[]).map((p) => p.id);
}

describe('getProjectName', () => {
  let getProjectName: (p: ProjectWithLimits) => string;

  beforeEach(async () => {
    ({ getProjectName } = await import('./project-collection'));
  });

  it('returns "Personal Project" for a PERSONAL type project', () => {
    const project = makeProject('p1', ProjectType.PERSONAL, CURRENT_USER_ID);
    expect(getProjectName(project)).toBe('Personal Project');
  });

  it('returns the displayName for a TEAM type project', () => {
    const project = makeProject(
      't1',
      ProjectType.TEAM,
      CURRENT_USER_ID,
      'Marketing',
    );
    expect(getProjectName(project)).toBe('Marketing');
  });

  it('ignores displayName for PERSONAL projects', () => {
    const project = makeProject(
      'p2',
      ProjectType.PERSONAL,
      CURRENT_USER_ID,
      'ShouldBeIgnored',
    );
    expect(getProjectName(project)).toBe('Personal Project');
  });
});

describe('useAll filter', () => {
  function query(projects: ProjectWithLimits[], userId: string | null) {
    const source = makeSource(projects);
    return idsFrom(
      createLiveQueryCollection({
        query: (q) =>
          q
            .from({ project: source })
            .where(({ project }) =>
              or(
                eq(project.type, ProjectType.TEAM),
                and(
                  eq(project.type, ProjectType.PERSONAL),
                  eq(project.ownerId, userId),
                ),
              ),
            )
            .select(({ project }) => ({ ...project })),
        startSync: true,
      }),
    );
  }

  it('includes a TEAM project owned by the current user', () => {
    expect(
      query(
        [makeProject('t1', ProjectType.TEAM, CURRENT_USER_ID)],
        CURRENT_USER_ID,
      ),
    ).toContain('t1');
  });

  it('includes a TEAM project owned by another user', () => {
    expect(
      query(
        [makeProject('t1', ProjectType.TEAM, OTHER_USER_ID)],
        CURRENT_USER_ID,
      ),
    ).toContain('t1');
  });

  it("includes the current user's PERSONAL project", () => {
    expect(
      query(
        [makeProject('pMine', ProjectType.PERSONAL, CURRENT_USER_ID)],
        CURRENT_USER_ID,
      ),
    ).toContain('pMine');
  });

  it("excludes another user's PERSONAL project", () => {
    expect(
      query(
        [makeProject('pOther', ProjectType.PERSONAL, OTHER_USER_ID)],
        CURRENT_USER_ID,
      ),
    ).not.toContain('pOther');
  });

  it('excludes all PERSONAL projects from other users', () => {
    expect(
      query(
        [
          makeProject('p1', ProjectType.PERSONAL, OTHER_USER_ID),
          makeProject('p2', ProjectType.PERSONAL, 'userThird'),
        ],
        CURRENT_USER_ID,
      ),
    ).toHaveLength(0);
  });

  it('shows TEAM projects and only own PERSONAL from a full platform collection', () => {
    const projects = [
      makeProject('teamA', ProjectType.TEAM, 'platformOwner'),
      makeProject('teamB', ProjectType.TEAM, 'platformOwner'),
      makeProject('personalMine', ProjectType.PERSONAL, CURRENT_USER_ID),
      makeProject('personalOther1', ProjectType.PERSONAL, OTHER_USER_ID),
      makeProject('personalOther2', ProjectType.PERSONAL, 'userThird'),
    ];

    const ids = query(projects, CURRENT_USER_ID);

    expect(ids).toContain('teamA');
    expect(ids).toContain('teamB');
    expect(ids).toContain('personalMine');
    expect(ids).not.toContain('personalOther1');
    expect(ids).not.toContain('personalOther2');
    expect(ids).toHaveLength(3);
  });
});

describe('useAllPlatformProjects filter', () => {
  const allProjects = [
    makeProject('t1', ProjectType.TEAM, 'owner', 'Alpha'),
    makeProject('t2', ProjectType.TEAM, 'owner', 'Beta'),
    makeProject('p1', ProjectType.PERSONAL, CURRENT_USER_ID, 'Personal'),
    makeProject('p2', ProjectType.PERSONAL, OTHER_USER_ID, 'Other Personal'),
  ];

  function query(
    projects: ProjectWithLimits[],
    filters?: { displayName?: string; type?: ProjectType[] },
  ) {
    const source = makeSource(projects);
    return idsFrom(
      createLiveQueryCollection({
        query: (q) => {
          let builder = q.from({ project: source });

          if (filters?.displayName) {
            builder = builder.where(({ project }) =>
              like(project.displayName, `%${filters.displayName}%`),
            ) as typeof builder;
          }

          if (filters?.type && filters.type.length > 0) {
            builder = builder.where(({ project }) => {
              const types = filters.type!;
              if (types.length === 1) return eq(project.type, types[0]);
              const conditions = types.map((t) => eq(project.type, t)) as [
                ReturnType<typeof eq>,
                ReturnType<typeof eq>,
                ...ReturnType<typeof eq>[],
              ];
              return or(...conditions);
            }) as typeof builder;
          }

          return builder.select(({ project }) => ({ ...project }));
        },
        startSync: true,
      }),
    );
  }

  it('returns all projects when no filters are applied', () => {
    expect(query(allProjects)).toHaveLength(4);
  });

  it('filters by displayName substring', () => {
    const ids = query(allProjects, { displayName: 'eta' });
    expect(ids).toContain('t2');
    expect(ids).not.toContain('t1');
  });

  it('filters to only TEAM projects when type is [TEAM]', () => {
    const ids = query(allProjects, { type: [ProjectType.TEAM] });
    expect(ids).toContain('t1');
    expect(ids).toContain('t2');
    expect(ids).not.toContain('p1');
    expect(ids).not.toContain('p2');
  });

  it('filters to only PERSONAL projects when type is [PERSONAL]', () => {
    const ids = query(allProjects, { type: [ProjectType.PERSONAL] });
    expect(ids).toContain('p1');
    expect(ids).toContain('p2');
    expect(ids).not.toContain('t1');
    expect(ids).not.toContain('t2');
  });

  it('returns all projects when both types are specified', () => {
    expect(
      query(allProjects, { type: [ProjectType.TEAM, ProjectType.PERSONAL] }),
    ).toHaveLength(4);
  });
});

describe('useCurrentProject filter', () => {
  function query(projects: ProjectWithLimits[], projectId: string | null) {
    const source = makeSource(projects);
    return idsFrom(
      createLiveQueryCollection({
        query: (q) =>
          q
            .from({ project: source })
            .where(({ project }) => eq(project.id, projectId))
            .select(({ project }) => ({ ...project }))
            .findOne(),
        startSync: true,
      }),
    );
  }

  it('returns the matching project', () => {
    const projects = [
      makeProject('proj1', ProjectType.TEAM, 'owner'),
      makeProject('proj2', ProjectType.TEAM, 'owner'),
    ];
    const ids = query(projects, 'proj1');
    expect(ids).toContain('proj1');
    expect(ids).not.toContain('proj2');
  });

  it('returns nothing when the ID is not in the collection', () => {
    const projects = [makeProject('proj1', ProjectType.TEAM, 'owner')];
    expect(query(projects, 'projMissing')).toHaveLength(0);
  });
});

describe('useHasAccessToProject filter', () => {
  function hasAccess(
    projects: ProjectWithLimits[],
    projectId: string,
  ): boolean {
    const source = makeSource(projects);
    const result = createLiveQueryCollection({
      query: (q) =>
        q
          .from({ project: source })
          .where(({ project }) => eq(project.id, projectId))
          .select(({ project }) => ({ ...project }))
          .findOne(),
      startSync: true,
    });
    return [...result.values()].length > 0;
  }

  it('returns true when the project exists', () => {
    expect(
      hasAccess([makeProject('proj1', ProjectType.TEAM, 'owner')], 'proj1'),
    ).toBe(true);
  });

  it('returns false when the project does not exist', () => {
    expect(
      hasAccess(
        [makeProject('proj1', ProjectType.TEAM, 'owner')],
        'projMissing',
      ),
    ).toBe(false);
  });

  it('returns false for an empty collection', () => {
    expect(hasAccess([], 'proj1')).toBe(false);
  });
});

describe('setCurrentProject', () => {
  let switchToProject: ReturnType<typeof vi.fn>;
  let setCurrentProject: (projectId: string, pathName?: string) => void;

  beforeEach(async () => {
    vi.clearAllMocks();
    const session = await import('../../../lib/authentication-session');
    switchToProject = session.authenticationSession
      .switchToProject as ReturnType<typeof vi.fn>;
    ({
      projectCollectionUtils: { setCurrentProject },
    } = await import('./project-collection'));
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });
  });

  it('calls switchToProject with the given project ID', () => {
    setCurrentProject('projNew');
    expect(switchToProject).toHaveBeenCalledWith('projNew');
  });

  it('does not navigate when no pathName is provided', () => {
    window.location.href = 'http://original';
    setCurrentProject('projNew');
    expect(window.location.href).toBe('http://original');
  });

  it('replaces the project ID segment in the pathname and navigates', () => {
    setCurrentProject('projNew', '/projects/projOld/flows');
    expect(window.location.href).toBe('/projects/projNew/flows');
  });

  it('works at different route depths', () => {
    setCurrentProject('projNew', '/projects/projAbc123/automations');
    expect(window.location.href).toBe('/projects/projNew/automations');
  });

  it('does not modify paths without a /projects/:id segment', () => {
    setCurrentProject('projNew', '/platform/projects');
    expect(window.location.href).toBe('/platform/projects');
  });
});

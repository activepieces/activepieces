import { describe, expect, it } from 'vitest';

import { defaultProjectGuard } from '@/app/routes/platform/projects/lib/default-project-guard';

const alpha = { id: 'alpha' };
const beta = { id: 'beta' };
const gamma = { id: 'gamma' };

describe('defaultProjectGuard.projectToKeep', () => {
  it('keeps nothing while personal projects are on', () => {
    expect(
      defaultProjectGuard.projectToKeep({
        selectedProjects: [alpha, beta],
        defaultProjectIds: ['alpha', 'beta'],
        autoCreatePersonalProjects: true,
      }),
    ).toBeUndefined();
  });

  it('keeps nothing when some default projects stay behind', () => {
    expect(
      defaultProjectGuard.projectToKeep({
        selectedProjects: [alpha, gamma],
        defaultProjectIds: ['alpha', 'beta'],
        autoCreatePersonalProjects: false,
      }),
    ).toBeUndefined();
  });

  it('keeps the first default project when every default is selected', () => {
    expect(
      defaultProjectGuard.projectToKeep({
        selectedProjects: [gamma, beta, alpha],
        defaultProjectIds: ['alpha', 'beta'],
        autoCreatePersonalProjects: false,
      }),
    ).toBe(alpha);
  });

  it('keeps the only default project when it is selected alone', () => {
    expect(
      defaultProjectGuard.projectToKeep({
        selectedProjects: [beta],
        defaultProjectIds: ['beta'],
        autoCreatePersonalProjects: false,
      }),
    ).toBe(beta);
  });

  it('keeps nothing when there are no default projects', () => {
    expect(
      defaultProjectGuard.projectToKeep({
        selectedProjects: [alpha],
        defaultProjectIds: [],
        autoCreatePersonalProjects: false,
      }),
    ).toBeUndefined();
  });
});

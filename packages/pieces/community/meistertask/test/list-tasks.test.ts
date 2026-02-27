import { listTasks } from '../src/lib/actions/list-tasks';
import { HttpMethod } from '@activepieces/pieces-common';

// Mock the common module
jest.mock('../src/lib/common/common', () => ({
  makeRequest: jest.fn(),
  MEISTERTASK_API_URL: 'https://www.meistertask.com/api',
}));

import { makeRequest } from '../src/lib/common/common';

describe('listTasks Action', () => {
  const mockToken = 'test-access-token';
  const mockContext = {
    auth: { access_token: mockToken },
    propsValue: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should list all tasks when no filters provided', async () => {
    const mockTasks = [
      { id: 1, name: 'Task 1', status: 1, section_id: 10 },
      { id: 2, name: 'Task 2', status: 2, section_id: 11 },
    ];
    (makeRequest as jest.Mock).mockResolvedValue({ body: mockTasks });

    const result = await listTasks.run(mockContext as any);

    expect(makeRequest).toHaveBeenCalledWith(HttpMethod.GET, '/tasks', mockToken);
    expect(result.tasks).toHaveLength(2);
    expect(result.total_count).toBe(2);
    expect(result.tasks[0].status_text).toBe('open');
    expect(result.tasks[1].status_text).toBe('completed');
  });

  it('should filter tasks by section', async () => {
    const mockTasks = [{ id: 1, name: 'Section Task', status: 1 }];
    (makeRequest as jest.Mock).mockResolvedValue({ body: mockTasks });

    const contextWithSection = {
      ...mockContext,
      propsValue: { section: 10 },
    };

    const result = await listTasks.run(contextWithSection as any);

    expect(makeRequest).toHaveBeenCalledWith(HttpMethod.GET, '/sections/10/tasks', mockToken);
    expect(result.tasks).toHaveLength(1);
  });

  it('should filter tasks by project', async () => {
    const mockTasks = [{ id: 1, name: 'Project Task', status: 1 }];
    (makeRequest as jest.Mock).mockResolvedValue({ body: mockTasks });

    const contextWithProject = {
      ...mockContext,
      propsValue: { project: 5 },
    };

    const result = await listTasks.run(contextWithProject as any);

    expect(makeRequest).toHaveBeenCalledWith(HttpMethod.GET, '/projects/5/tasks', mockToken);
    expect(result.tasks).toHaveLength(1);
  });

  it('should filter by open status', async () => {
    const mockTasks = [
      { id: 1, name: 'Open Task', status: 1 },
      { id: 2, name: 'Completed Task', status: 2 },
    ];
    (makeRequest as jest.Mock).mockResolvedValue({ body: mockTasks });

    const contextWithStatus = {
      ...mockContext,
      propsValue: { status: 'open' },
    };

    const result = await listTasks.run(contextWithStatus as any);

    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].name).toBe('Open Task');
  });

  it('should filter by completed status', async () => {
    const mockTasks = [
      { id: 1, name: 'Open Task', status: 1 },
      { id: 2, name: 'Completed Task', status: 2 },
    ];
    (makeRequest as jest.Mock).mockResolvedValue({ body: mockTasks });

    const contextWithStatus = {
      ...mockContext,
      propsValue: { status: 'completed' },
    };

    const result = await listTasks.run(contextWithStatus as any);

    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].name).toBe('Completed Task');
  });

  it('should apply limit', async () => {
    const mockTasks = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      name: `Task ${i}`,
      status: 1,
    }));
    (makeRequest as jest.Mock).mockResolvedValue({ body: mockTasks });

    const contextWithLimit = {
      ...mockContext,
      propsValue: { limit: 5 },
    };

    const result = await listTasks.run(contextWithLimit as any);

    expect(result.tasks).toHaveLength(5);
    expect(result.total_count).toBe(5);
  });

  it('should return empty array when no tasks found', async () => {
    (makeRequest as jest.Mock).mockResolvedValue({ body: [] });

    const result = await listTasks.run(mockContext as any);

    expect(result.tasks).toEqual([]);
    expect(result.total_count).toBe(0);
  });
});

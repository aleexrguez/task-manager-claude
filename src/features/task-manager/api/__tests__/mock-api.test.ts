import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// The mock-api module has module-level state (`store`) loaded from localStorage.
// We use vi.resetModules() + dynamic import in each beforeEach to get a fresh
// store on every test, ensuring full isolation.

describe('mock-api', () => {
  let mockApi: typeof import('../mock-api');

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.resetModules();
    localStorage.clear();
    mockApi = await import('../mock-api');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ---------------------------------------------------------------------------
  // Group: createTask — new fields
  // ---------------------------------------------------------------------------

  describe('createTask — new fields', () => {
    it('creates a task with isArchived set to false', async () => {
      const promise = mockApi.createTask({
        title: 'New task',
        status: 'todo',
        priority: 'medium',
      });
      vi.runAllTimers();
      const task = await promise;

      expect(task.isArchived).toBe(false);
    });

    it('creates a task with completedAt set to undefined', async () => {
      const promise = mockApi.createTask({
        title: 'New task',
        status: 'todo',
        priority: 'medium',
      });
      vi.runAllTimers();
      const task = await promise;

      expect(task.completedAt).toBeUndefined();
    });

    it('creates a task with dueDate from input when provided', async () => {
      const promise = mockApi.createTask({
        title: 'Task with due date',
        status: 'todo',
        priority: 'low',
        dueDate: '2026-05-01',
      });
      vi.runAllTimers();
      const task = await promise;

      expect(task.dueDate).toBe('2026-05-01');
    });

    it('creates a task with dueDate as undefined when not in input', async () => {
      const promise = mockApi.createTask({
        title: 'Task without due date',
        status: 'todo',
        priority: 'low',
      });
      vi.runAllTimers();
      const task = await promise;

      expect(task.dueDate).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Group: updateTask — completedAt transitions
  // ---------------------------------------------------------------------------

  describe('updateTask — completedAt transitions', () => {
    it('sets completedAt when status changes from todo to done', async () => {
      const createPromise = mockApi.createTask({
        title: 'A task',
        status: 'todo',
        priority: 'medium',
      });
      vi.runAllTimers();
      const created = await createPromise;

      const updatePromise = mockApi.updateTask(created.id, { status: 'done' });
      vi.runAllTimers();
      const updated = await updatePromise;

      expect(updated.completedAt).toBeDefined();
    });

    it('sets completedAt when status changes from in-progress to done', async () => {
      const createPromise = mockApi.createTask({
        title: 'A task',
        status: 'in-progress',
        priority: 'medium',
      });
      vi.runAllTimers();
      const created = await createPromise;

      const updatePromise = mockApi.updateTask(created.id, { status: 'done' });
      vi.runAllTimers();
      const updated = await updatePromise;

      expect(updated.completedAt).toBeDefined();
    });

    it('completedAt is a valid ISO datetime string when auto-set', async () => {
      const createPromise = mockApi.createTask({
        title: 'A task',
        status: 'todo',
        priority: 'medium',
      });
      vi.runAllTimers();
      const created = await createPromise;

      const updatePromise = mockApi.updateTask(created.id, { status: 'done' });
      vi.runAllTimers();
      const updated = await updatePromise;

      expect(updated.completedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      );
      expect(new Date(updated.completedAt!).getTime()).not.toBeNaN();
    });

    it('clears completedAt when status changes from done to todo', async () => {
      const createPromise = mockApi.createTask({
        title: 'A task',
        status: 'todo',
        priority: 'medium',
      });
      vi.runAllTimers();
      const created = await createPromise;

      const donePromise = mockApi.updateTask(created.id, { status: 'done' });
      vi.runAllTimers();
      await donePromise;

      const revertPromise = mockApi.updateTask(created.id, { status: 'todo' });
      vi.runAllTimers();
      const reverted = await revertPromise;

      expect(reverted.completedAt).toBeUndefined();
    });

    it('clears completedAt when status changes from done to in-progress', async () => {
      const createPromise = mockApi.createTask({
        title: 'A task',
        status: 'todo',
        priority: 'medium',
      });
      vi.runAllTimers();
      const created = await createPromise;

      const donePromise = mockApi.updateTask(created.id, { status: 'done' });
      vi.runAllTimers();
      await donePromise;

      const revertPromise = mockApi.updateTask(created.id, {
        status: 'in-progress',
      });
      vi.runAllTimers();
      const reverted = await revertPromise;

      expect(reverted.completedAt).toBeUndefined();
    });

    it('does not change completedAt when status stays done (updating other fields)', async () => {
      const createPromise = mockApi.createTask({
        title: 'A task',
        status: 'todo',
        priority: 'medium',
      });
      vi.runAllTimers();
      const created = await createPromise;

      const donePromise = mockApi.updateTask(created.id, { status: 'done' });
      vi.runAllTimers();
      const done = await donePromise;
      const originalCompletedAt = done.completedAt;

      const updatePromise = mockApi.updateTask(done.id, {
        title: 'Updated title',
        status: 'done',
      });
      vi.runAllTimers();
      const updated = await updatePromise;

      expect(updated.completedAt).toBe(originalCompletedAt);
    });

    it('does not change completedAt when status stays non-done', async () => {
      const createPromise = mockApi.createTask({
        title: 'A task',
        status: 'todo',
        priority: 'medium',
      });
      vi.runAllTimers();
      const created = await createPromise;

      const updatePromise = mockApi.updateTask(created.id, {
        title: 'New title',
        status: 'todo',
      });
      vi.runAllTimers();
      const updated = await updatePromise;

      expect(updated.completedAt).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Group: updateTask — isArchived transition
  // ---------------------------------------------------------------------------

  describe('updateTask — isArchived transition', () => {
    it('resets isArchived to false when status moves from done to another status', async () => {
      const createPromise = mockApi.createTask({
        title: 'A task',
        status: 'todo',
        priority: 'medium',
      });
      vi.runAllTimers();
      const created = await createPromise;

      const donePromise = mockApi.updateTask(created.id, { status: 'done' });
      vi.runAllTimers();
      const done = await donePromise;

      // Archive the task first
      const archivePromise = mockApi.archiveTask(done.id);
      vi.runAllTimers();
      const archived = await archivePromise;
      expect(archived.isArchived).toBe(true);

      // Now change status away from done
      const revertPromise = mockApi.updateTask(done.id, {
        status: 'in-progress',
      });
      vi.runAllTimers();
      const reverted = await revertPromise;

      expect(reverted.isArchived).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Group: archiveTask
  // ---------------------------------------------------------------------------

  describe('archiveTask', () => {
    it('sets isArchived to true for a done task', async () => {
      const createPromise = mockApi.createTask({
        title: 'A done task',
        status: 'todo',
        priority: 'medium',
      });
      vi.runAllTimers();
      const created = await createPromise;

      const donePromise = mockApi.updateTask(created.id, { status: 'done' });
      vi.runAllTimers();
      await donePromise;

      const archivePromise = mockApi.archiveTask(created.id);
      vi.runAllTimers();
      const archived = await archivePromise;

      expect(archived.isArchived).toBe(true);
    });

    it('throws if the task status is not done', async () => {
      const createPromise = mockApi.createTask({
        title: 'Not done task',
        status: 'todo',
        priority: 'medium',
      });
      vi.runAllTimers();
      const created = await createPromise;

      const archivePromise = mockApi.archiveTask(created.id);
      vi.runAllTimers();

      await expect(archivePromise).rejects.toThrow();
    });

    it('throws if task ID does not exist', async () => {
      const archivePromise = mockApi.archiveTask(
        '00000000-0000-4000-a000-000000000000',
      );
      vi.runAllTimers();

      await expect(archivePromise).rejects.toThrow();
    });

    it('updates updatedAt timestamp when archiving', async () => {
      const createPromise = mockApi.createTask({
        title: 'A done task',
        status: 'todo',
        priority: 'medium',
      });
      vi.runAllTimers();
      const created = await createPromise;

      const donePromise = mockApi.updateTask(created.id, { status: 'done' });
      vi.runAllTimers();
      const done = await donePromise;
      const updatedAtBeforeArchive = done.updatedAt;

      // Advance time so the new updatedAt is different
      vi.advanceTimersByTime(1000);

      const archivePromise = mockApi.archiveTask(created.id);
      vi.runAllTimers();
      const archived = await archivePromise;

      expect(archived.updatedAt).not.toBe(updatedAtBeforeArchive);
    });
  });

  // ---------------------------------------------------------------------------
  // Group: unarchiveTask
  // ---------------------------------------------------------------------------

  describe('unarchiveTask', () => {
    it('sets isArchived to false on an archived task', async () => {
      const createPromise = mockApi.createTask({
        title: 'A done task',
        status: 'todo',
        priority: 'medium',
      });
      vi.runAllTimers();
      const created = await createPromise;

      const donePromise = mockApi.updateTask(created.id, { status: 'done' });
      vi.runAllTimers();
      await donePromise;

      const archivePromise = mockApi.archiveTask(created.id);
      vi.runAllTimers();
      await archivePromise;

      const unarchivePromise = mockApi.unarchiveTask(created.id);
      vi.runAllTimers();
      const unarchived = await unarchivePromise;

      expect(unarchived.isArchived).toBe(false);
    });

    it('throws if task ID does not exist', async () => {
      const unarchivePromise = mockApi.unarchiveTask(
        '00000000-0000-4000-a000-000000000000',
      );
      vi.runAllTimers();

      await expect(unarchivePromise).rejects.toThrow();
    });

    it('updates updatedAt timestamp when unarchiving', async () => {
      const createPromise = mockApi.createTask({
        title: 'A done task',
        status: 'todo',
        priority: 'medium',
      });
      vi.runAllTimers();
      const created = await createPromise;

      const donePromise = mockApi.updateTask(created.id, { status: 'done' });
      vi.runAllTimers();
      await donePromise;

      const archivePromise = mockApi.archiveTask(created.id);
      vi.runAllTimers();
      const archived = await archivePromise;
      const updatedAtBeforeUnarchive = archived.updatedAt;

      vi.advanceTimersByTime(1000);

      const unarchivePromise = mockApi.unarchiveTask(created.id);
      vi.runAllTimers();
      const unarchived = await unarchivePromise;

      expect(unarchived.updatedAt).not.toBe(updatedAtBeforeUnarchive);
    });
  });

  // ---------------------------------------------------------------------------
  // Group: purgeTasks
  // ---------------------------------------------------------------------------

  describe('purgeTasks', () => {
    it('removes specified task IDs from the store', async () => {
      const p1 = mockApi.createTask({
        title: 'Task A',
        status: 'todo',
        priority: 'low',
      });
      vi.runAllTimers();
      const taskA = await p1;

      const p2 = mockApi.createTask({
        title: 'Task B',
        status: 'todo',
        priority: 'low',
      });
      vi.runAllTimers();
      const taskB = await p2;

      const purgePromise = mockApi.purgeTasks([taskA.id, taskB.id]);
      vi.runAllTimers();
      await purgePromise;

      const fetchPromise = mockApi.fetchTasks();
      vi.runAllTimers();
      const { tasks } = await fetchPromise;

      const ids = tasks.map((t) => t.id);
      expect(ids).not.toContain(taskA.id);
      expect(ids).not.toContain(taskB.id);
    });

    it('does not affect tasks not in the ID list', async () => {
      const p1 = mockApi.createTask({
        title: 'Task to keep',
        status: 'todo',
        priority: 'medium',
      });
      vi.runAllTimers();
      const keeper = await p1;

      const p2 = mockApi.createTask({
        title: 'Task to purge',
        status: 'todo',
        priority: 'low',
      });
      vi.runAllTimers();
      const toDelete = await p2;

      const purgePromise = mockApi.purgeTasks([toDelete.id]);
      vi.runAllTimers();
      await purgePromise;

      const fetchPromise = mockApi.fetchTasks();
      vi.runAllTimers();
      const { tasks } = await fetchPromise;

      const ids = tasks.map((t) => t.id);
      expect(ids).toContain(keeper.id);
    });

    it('is a no-op when called with an empty ID array', async () => {
      const fetchBefore = mockApi.fetchTasks();
      vi.runAllTimers();
      const { total: totalBefore } = await fetchBefore;

      const purgePromise = mockApi.purgeTasks([]);
      vi.runAllTimers();
      await purgePromise;

      const fetchAfter = mockApi.fetchTasks();
      vi.runAllTimers();
      const { total: totalAfter } = await fetchAfter;

      expect(totalAfter).toBe(totalBefore);
    });
  });
});

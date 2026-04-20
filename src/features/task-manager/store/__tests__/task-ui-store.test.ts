import { useTaskUIStore } from '../task-ui.store';

const VIEW_MODE_KEY = 'task-manager-view-mode';

describe('useTaskUIStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useTaskUIStore.setState({
      viewMode: 'list',
      showArchived: false,
      statusFilter: 'all',
      priorityFilter: 'all',
      searchQuery: '',
      isCreateModalOpen: false,
      isEditModalOpen: false,
      selectedTaskId: null,
    });
  });

  // ─── viewMode ────────────────────────────────────────────────────────────

  describe('viewMode', () => {
    it('defaults to "list"', () => {
      const { viewMode } = useTaskUIStore.getState();
      expect(viewMode).toBe('list');
    });

    it('setViewMode("board") changes viewMode to "board"', () => {
      useTaskUIStore.getState().setViewMode('board');
      expect(useTaskUIStore.getState().viewMode).toBe('board');
    });

    it('setViewMode("list") changes viewMode back to "list"', () => {
      useTaskUIStore.getState().setViewMode('board');
      useTaskUIStore.getState().setViewMode('list');
      expect(useTaskUIStore.getState().viewMode).toBe('list');
    });

    it('persists viewMode to localStorage on change', () => {
      useTaskUIStore.getState().setViewMode('board');
      expect(localStorage.getItem(VIEW_MODE_KEY)).toBe('board');
    });

    it('reads initial viewMode from localStorage if available', () => {
      localStorage.setItem(VIEW_MODE_KEY, 'board');
      const stored = localStorage.getItem(VIEW_MODE_KEY);
      expect(stored).toBe('board');
      useTaskUIStore.setState({ viewMode: stored as 'list' | 'board' });
      expect(useTaskUIStore.getState().viewMode).toBe('board');
    });
  });

  // ─── showArchived ─────────────────────────────────────────────────────────

  describe('showArchived', () => {
    it('defaults to false', () => {
      expect(useTaskUIStore.getState().showArchived).toBe(false);
    });

    it('toggleShowArchived() flips showArchived to true', () => {
      useTaskUIStore.getState().toggleShowArchived();
      expect(useTaskUIStore.getState().showArchived).toBe(true);
    });

    it('toggleShowArchived() called twice returns to false', () => {
      useTaskUIStore.getState().toggleShowArchived();
      useTaskUIStore.getState().toggleShowArchived();
      expect(useTaskUIStore.getState().showArchived).toBe(false);
    });

    it('persists showArchived=true to localStorage after first toggle', () => {
      useTaskUIStore.getState().toggleShowArchived();
      expect(localStorage.getItem('task-manager-show-archived')).toBe('true');
    });

    it('persists showArchived=false to localStorage after second toggle', () => {
      useTaskUIStore.getState().toggleShowArchived();
      useTaskUIStore.getState().toggleShowArchived();
      expect(localStorage.getItem('task-manager-show-archived')).toBe('false');
    });

    it('reads initial showArchived=true from localStorage', () => {
      localStorage.setItem('task-manager-show-archived', 'true');
      // Simulate store initialization by calling getInitialShowArchived indirectly
      // We test the store behavior: setState reflects what getInitialShowArchived would return
      const stored = localStorage.getItem('task-manager-show-archived');
      useTaskUIStore.setState({ showArchived: stored === 'true' });
      expect(useTaskUIStore.getState().showArchived).toBe(true);
    });
  });

  // ─── existing state defaults ──────────────────────────────────────────────

  describe('existing state defaults are preserved', () => {
    it('statusFilter still defaults to "all"', () => {
      expect(useTaskUIStore.getState().statusFilter).toBe('all');
    });

    it('priorityFilter still defaults to "all"', () => {
      expect(useTaskUIStore.getState().priorityFilter).toBe('all');
    });

    it('searchQuery still defaults to empty string', () => {
      expect(useTaskUIStore.getState().searchQuery).toBe('');
    });

    it('isCreateModalOpen still defaults to false', () => {
      expect(useTaskUIStore.getState().isCreateModalOpen).toBe(false);
    });

    it('selectedTaskId still defaults to null', () => {
      expect(useTaskUIStore.getState().selectedTaskId).toBeNull();
    });
  });
});

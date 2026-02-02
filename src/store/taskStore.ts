import { create } from 'zustand';
import { Task, Column, Board, Label, Priority, TeamMember, DEFAULT_LABELS } from '@/types/task';
import * as api from '@/api';
import { toast } from 'sonner';
import { socketService } from '@/lib/socket';
import { format } from 'date-fns';
import { playNotificationWithSettings } from '@/lib/audio';

interface Notification {
  id: string;
  message: string;
  type: string;
  boardId?: string;
  taskId?: string;
  read: boolean;
  createdAt: string;
}

interface TaskState {
  boards: Board[];
  publicBoards: Board[];
  tasks: Record<string, Task>;
  currentBoardId: string | null;
  notifications: Notification[];
  availableLabels: Label[];
  loading: boolean;
  error: string | null;

  // Board actions
  setBoards: (boards: Board[]) => void;
  fetchBoards: () => Promise<void>;
  fetchPublicBoards: () => Promise<void>;
  createBoard: (title: string, description?: string, isPublic?: boolean) => Promise<string | null>;
  updateBoard: (boardId: string, updates: Partial<Board>) => Promise<void>;
  deleteBoard: (boardId: string) => Promise<void>;
  setCurrentBoard: (boardId: string) => void;

  // Task actions
  fetchTasks: (boardId: string) => Promise<void>;
  createTask: (data: any) => Promise<string | null>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  moveTask: (taskId: string, sourceStatus: string, destStatus: string, destIndex: number) => Promise<void>;

  // Notification actions
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;

  // Member management actions
  addMember: (boardId: string, email: string) => Promise<void>;
  acceptMemberInvitation: (boardId: string) => Promise<void>;
  rejectMemberInvitation: (boardId: string) => Promise<void>;
  removeMember: (boardId: string, memberId: string) => Promise<void>;
  updateMemberRole: (boardId: string, memberId: string, role: 'admin' | 'member') => Promise<void>;
  checkDeadlines: () => void;

  // Comment actions
  fetchComments: (taskId: string) => Promise<any[]>;
  addComment: (taskId: string, text: string, options?: { parentId?: string, screenshotUrl?: string, attachments?: any[] }) => Promise<void>;
  updateComment: (commentId: string, text: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;

  // Helper
  getCurrentBoard: () => Board | null;
  initializeSocket: (token: string, userId: string) => void;
  handleRealTimeEvent: (event: string, data: any) => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  boards: [],
  publicBoards: [],
  tasks: {},
  currentBoardId: null,
  notifications: [],
  availableLabels: DEFAULT_LABELS,
  loading: false,
  error: null,

  setBoards: (boards) => set({ boards }),

  fetchBoards: async () => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem('taskflow_token');
      if (!token) throw new Error('No token found');

      const response = await api.fetchBoards(token) as { data: any[] };

      // const currentBoards = get().boards; // Unused but kept for context if needed

      const boardsData = response.data.map((b: any) => {
        const boardId = String(b.id || b._id);
        const existingBoard = get().boards.find((ex) => ex.id === boardId);

        // Ensure ownerId is a string
        const ownerId = b.ownerId?._id || b.ownerId?.id || b.ownerId;

        // Parse members if it's a JSON string, otherwise use as-is
        let members = b.members || [];
        if (typeof members === 'string') {
          try {
            members = JSON.parse(members);
          } catch (e) {
            console.error(`❌ Failed to parse members JSON for board ${boardId}:`, e);
            members = [];
          }
        }
        if (!Array.isArray(members)) {
          members = [];
        }

        // Parse columns if it's a JSON string, otherwise use as-is
        let columns = b.columns || [];
        if (typeof columns === 'string') {
          try {
            columns = JSON.parse(columns);
          } catch (e) {
            console.error(`❌ Failed to parse columns JSON for board ${boardId}:`, e);
            columns = [];
          }
        }

        return {
          ...b,
          id: boardId,
          title: b.name || b.title,
          description: b.description || '',
          isPublic: b.isPublic || false,
          ownerId: String(ownerId),
          ownerName: b.owner?.name || b.ownerName || 'Unknown',
          ownerAvatar: b.owner?.avatar || b.ownerAvatar,
          taskCount: b.taskCount || 0,
          members: members.map((m: any) => ({
            ...m,
            id: String(m.id || m._id),
            role: m.role || 'member',
            status: m.status || 'active'
          })),
          columns: (Array.isArray(columns) && columns.length > 0) ? columns : (existingBoard?.columns || [
            { id: 'todo', title: 'To Do', taskIds: [], position: 0 },
            { id: 'in-progress', title: 'In Progress', taskIds: [], position: 1 },
            { id: 'done', title: 'Done', taskIds: [], position: 2 },
          ]),
          createdAt: b.createdAt || new Date().toISOString(),
          updatedAt: b.updatedAt || new Date().toISOString(),
          isShared: (members && members.length > 0) || false
        } as Board;
      });

      set({ boards: boardsData, loading: false });
    } catch (error: any) {
      console.error('❌ fetchBoards error:', error);
      set({ error: error.message, loading: false });
    }
  },

  fetchPublicBoards: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.fetchCommunityBoards() as { data: any[] };
      const currentPublicBoards = get().publicBoards;

      const boardsData = response.data.map((b: any) => {
        const boardId = String(b._id || b.id);
        const existingBoard = currentPublicBoards.find(eb => eb.id === boardId);

        return {
          ...b,
          id: boardId,
          title: b.name || b.title,
          ownerId: String(b.ownerId?._id || b.ownerId?.id || b.ownerId),
          ownerName: b.owner?.name || b.ownerName || 'Unknown',
          ownerAvatar: b.owner?.avatar || b.ownerAvatar,
          taskCount: b.taskCount || 0,
          members: (b.members || []).map((m: any) => ({
            ...m,
            id: String(m.id || m._id)
          })),
          columns: existingBoard?.columns || [
            { id: 'todo', title: 'To Do', taskIds: [], position: 0 },
            { id: 'in-progress', title: 'In Progress', taskIds: [], position: 1 },
            { id: 'done', title: 'Done', taskIds: [], position: 2 },
          ]
        } as Board;
      });
      set({ publicBoards: boardsData, loading: false });
    } catch (error: any) {
      console.error('❌ fetchPublicBoards error:', error);
      set({ error: error.message, loading: false });
    }
  },

  createBoard: async (title, description = '', isPublic = false) => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem('taskflow_token');
      if (!token) throw new Error('No token found');
      const response = await api.createBoard(token, { name: title, description, isPublic }) as { data: any };
      const newBoard = {
        ...response.data,
        id: String(response.data.id || response.data._id),
        title: response.data.name,
        ownerId: String(response.data.ownerId?._id || response.data.ownerId?.id || response.data.ownerId),
        ownerName: response.data.owner?.name || 'Unknown',
        ownerAvatar: response.data.owner?.avatar,
        members: (response.data.members || []).map((m: any) => ({
          ...m,
          id: String(m.id || m._id)
        })),
        columns: [
          { id: 'todo', title: 'To Do', taskIds: [], position: 0 },
          { id: 'in-progress', title: 'In Progress', taskIds: [], position: 1 },
          { id: 'done', title: 'Done', taskIds: [], position: 2 },
        ]
      };
      set((state) => ({
        boards: [...state.boards, newBoard],
        currentBoardId: newBoard.id,
        loading: false
      }));
      get().fetchNotifications();
      return newBoard.id;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return null;
    }
  },

  updateBoard: async (boardId, updates) => {
    try {
      const token = localStorage.getItem('taskflow_token');
      if (!token) return;
      const apiUpdates = {
        name: updates.title,
        description: updates.description,
        isPublic: updates.isPublic,
        columns: updates.columns
      };
      await api.updateBoard(token, boardId, apiUpdates);
      set((state) => ({
        boards: state.boards.map((b) => (b.id === boardId ? { ...b, ...updates } : b)),
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  deleteBoard: async (boardId) => {
    try {
      const token = localStorage.getItem('taskflow_token');
      if (!token) return;
      await api.deleteBoard(token, boardId);
      set((state) => ({
        boards: state.boards.filter((b) => b.id !== boardId),
        currentBoardId: state.currentBoardId === boardId ? null : state.currentBoardId,
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  setCurrentBoard: (boardId) => {
    set({ currentBoardId: boardId });
    if (boardId) {
      socketService.joinBoard(boardId);
    }
  },

  fetchTasks: async (boardId) => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem('taskflow_token');
      if (!token) {
        console.warn('⚠️ No token found in fetchTasks');
        return;
      }

      const response = await api.fetchTasks(token, boardId) as { data: any[] };

      const tasksMap: Record<string, Task> = {};
      const { boards, publicBoards, tasks: existingTasks } = get();

      const updateBoardTasks = (b: Board) => {
        if (b.id !== boardId) return b;

        // Parse columns if it's a JSON string
        let columns = b.columns || [];
        if (typeof columns === 'string') {
          try {
            columns = JSON.parse(columns);
          } catch (e) {
            columns = [];
          }
        }

        if (!Array.isArray(columns)) {
          console.warn('⚠️ columns is not an array for board:', b.id, columns);
          columns = [];
        }

        // Keep existing columns but reset their taskIds for this specific board update
        const updatedColumns = columns.map(col => ({
          ...col,
          taskIds: [] as string[]
        }));

        response.data.forEach((t: any) => {
          // Parse labels if it's a JSON string
          let labels = t.labels || [];
          if (typeof labels === 'string') {
            try {
              labels = JSON.parse(labels);
            } catch (e) {
              labels = [];
            }
          }

          const task = {
            ...t,
            id: String(t.id || t._id),
            boardId: String(t.boardId),
            columnId: t.status || 'todo',
            labels: Array.isArray(labels) ? labels : [],
          };
          tasksMap[task.id] = task;
          const col = updatedColumns.find(c => c.id === task.columnId);
          if (col) {
            col.taskIds.push(task.id);
          } else {
            console.warn(`⚠️ Column not found for task ${task.id} with status ${task.columnId}`);
          }
        });

        return { ...b, columns: updatedColumns };
      };

      const updatedBoards = boards.map(updateBoardTasks);
      const updatedPublicBoards = publicBoards.map(updateBoardTasks);

      set({
        tasks: { ...existingTasks, ...tasksMap },
        boards: updatedBoards,
        publicBoards: updatedPublicBoards,
        loading: false
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createTask: async (data) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticTask = {
      ...data,
      id: tempId,
      columnId: data.columnId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistic update - add task immediately
    set((state) => {
      const newTasks = { ...state.tasks, [tempId]: optimisticTask };
      const newBoards = state.boards.map(b => {
        if (b.id !== data.boardId) return b;
        return {
          ...b,
          columns: b.columns.map(c =>
            c.id === data.columnId ? { ...c, taskIds: [...c.taskIds, tempId] } : c
          )
        };
      });
      return { tasks: newTasks, boards: newBoards };
    });

    try {
      const token = localStorage.getItem('taskflow_token');
      if (!token) throw new Error('No token found');

      const response = await api.createTask(token, { ...data, status: data.columnId }) as { data: any };
      const newTask = {
        ...response.data,
        id: String(response.data.id || response.data._id),
        boardId: String(response.data.boardId),
        columnId: response.data.status,
      };

      // Replace optimistic task with real task
      set((state) => {
        const newTasks = { ...state.tasks };
        delete newTasks[tempId];
        newTasks[newTask.id] = newTask;

        const newBoards = state.boards.map(b => {
          if (b.id !== newTask.boardId) return b;
          return {
            ...b,
            columns: b.columns.map(c =>
              c.id === newTask.columnId
                ? { ...c, taskIds: c.taskIds.map(id => id === tempId ? newTask.id : id) }
                : c
            )
          };
        });
        return { tasks: newTasks, boards: newBoards };
      });

      get().fetchNotifications();
      return newTask.id;
    } catch (error: any) {
      // Rollback optimistic update on error
      set((state) => {
        const newTasks = { ...state.tasks };
        delete newTasks[tempId];
        const newBoards = state.boards.map(b => {
          if (b.id !== data.boardId) return b;
          return {
            ...b,
            columns: b.columns.map(c => ({
              ...c,
              taskIds: c.taskIds.filter(id => id !== tempId)
            }))
          };
        });
        return { tasks: newTasks, boards: newBoards, error: error.message };
      });
      toast.error(error.message || 'Failed to create task');
      return null;
    }
  },

  updateTask: async (taskId, updates) => {
    try {
      const token = localStorage.getItem('taskflow_token');
      if (!token) return;
      const apiUpdates = { ...updates, status: updates.columnId };
      await api.updateTask(token, taskId, apiUpdates);
      set((state) => ({
        tasks: {
          ...state.tasks,
          [taskId]: { ...state.tasks[taskId], ...updates },
        },
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  deleteTask: async (taskId) => {
    try {
      const token = localStorage.getItem('taskflow_token');
      if (!token) return;
      const task = get().tasks[taskId];
      await api.deleteTask(token, taskId);
      set((state) => {
        const newTasks = { ...state.tasks };
        delete newTasks[taskId];
        const newBoards = state.boards.map(b => {
          if (b.id !== task.boardId) return b;
          return {
            ...b,
            columns: b.columns.map(c => ({
              ...c,
              taskIds: c.taskIds.filter(id => id !== taskId)
            }))
          };
        });
        return { tasks: newTasks, boards: newBoards };
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  moveTask: async (taskId, sourceStatus, destStatus, destIndex) => {
    const originalState = get();
    const task = originalState.tasks[String(taskId)];
    const board = originalState.boards.find(b => String(b.id) === String(task.boardId));

    if (!board) return;

    // Create new boards state with atomic column updates
    const newBoards = originalState.boards.map(b => {
      if (b.id !== task.boardId) return b;

      return {
        ...b,
        columns: b.columns.map(col => {
          // Moving within same column (reordering)
          if (col.id === sourceStatus && col.id === destStatus) {
            const newTaskIds = col.taskIds.filter(id => id !== taskId);
            newTaskIds.splice(destIndex, 0, taskId);
            return { ...col, taskIds: newTaskIds };
          }

          // Remove from source column
          if (col.id === sourceStatus) {
            return { ...col, taskIds: col.taskIds.filter(id => id !== taskId) };
          }

          // Add to destination column (only if not already there)
          if (col.id === destStatus) {
            // Ensure task isn't already in this column to prevent duplicates
            const taskIds = col.taskIds.filter(id => id !== taskId);
            taskIds.splice(destIndex, 0, taskId);
            return { ...col, taskIds };
          }

          return col;
        })
      };
    });

    // Single atomic state update
    set({
      tasks: {
        ...originalState.tasks,
        [taskId]: {
          ...task,
          columnId: destStatus,
          status: destStatus as any // Update both to ensure UI sync
        }
      },
      boards: newBoards
    });

    // Defer the API call to let the UI update immediately
    setTimeout(async () => {
      try {
        const token = localStorage.getItem('taskflow_token');
        if (!token) throw new Error('No token');
        await api.updateTask(token, taskId, { status: destStatus, position: destIndex });
      } catch (error: any) {
        // Revert changes on error
        set({ tasks: originalState.tasks, boards: originalState.boards, error: error.message });
        toast.error('Failed to save task move');
      }
    }, 0);
  },

  fetchNotifications: async () => {
    try {
      const token = localStorage.getItem('taskflow_token');
      if (!token) return;
      const response = await api.fetchNotifications(token) as { data: any[] };
      const notifications = response.data.map((n: any) => ({
        ...n,
        id: String(n.id || n._id),
      }));
      set({ notifications });
    } catch (error: any) {
      console.error('Fetch notifications error:', error);
    }
  },

  markAsRead: async (id) => {
    try {
      const token = localStorage.getItem('taskflow_token');
      if (!token) return;
      await api.markAsRead(token, id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
      }));
    } catch (error: any) {
      console.error('Mark read error:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      const token = localStorage.getItem('taskflow_token');
      if (!token) return;
      await api.markAllAsRead(token);
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      }));
    } catch (error: any) {
      console.error('Mark all read error:', error);
    }
  },

  deleteNotification: async (id) => {
    try {
      const token = localStorage.getItem('taskflow_token');
      if (!token) return;
      await api.deleteNotification(token, id);
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    } catch (error: any) {
      console.error('Delete notification error:', error);
    }
  },

  clearAllNotifications: async () => {
    try {
      const token = localStorage.getItem('taskflow_token');
      if (!token) return;
      await api.clearAllNotifications(token);
      set({ notifications: [] });
    } catch (error: any) {
      console.error('Clear all notifications error:', error);
    }
  },

  addMember: async (boardId, email) => {
    const optimisticMember: TeamMember = {
      id: `temp-${Date.now()}`,
      email,
      name: email.split('@')[0],
      status: 'pending',
      role: 'member' as 'member'
    };

    // Optimistic update - show member immediately
    set((state) => ({
      boards: state.boards.map((b) => (b.id === boardId ? {
        ...b,
        members: [...(b.members || []), optimisticMember]
      } : b)),
    }));

    try {
      const token = localStorage.getItem('taskflow_token');
      if (!token) throw new Error('No token found');

      const response = await api.addMember(token, boardId, email) as { data: any };
      const updatedBoardData = response.data;

      const updateBoards = (boards: Board[]) =>
        boards.map((b) => (b.id === boardId ? {
          ...b,
          title: updatedBoardData.name,
          taskCount: updatedBoardData.taskCount || b.taskCount,
          members: updatedBoardData.members.map((m: any) => ({
            ...m,
            id: m.id || m._id
          }))
        } : b));

      // Replace optimistic member with real data in both lists
      set((state) => ({
        boards: updateBoards(state.boards),
        publicBoards: updateBoards(state.publicBoards),
      }));
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || '';
      const isNotFound = error.response?.status === 404 || errorMsg.includes('User not found');

      if (isNotFound) {
        // Throw to let InviteModal handle email invite, but skip rollback
        throw error;
      }

      // Rollback optimistic update on error in both lists
      const rollbackBoards = (boards: Board[]) =>
        boards.map((b) => (b.id === boardId ? {
          ...b,
          members: b.members.filter(m => m.id !== optimisticMember.id)
        } : b));

      set((state) => ({
        boards: rollbackBoards(state.boards),
        publicBoards: rollbackBoards(state.publicBoards),
        error: error.message
      }));
      throw error;
    }
  },

  acceptMemberInvitation: async (boardId) => {
    try {
      const token = localStorage.getItem('taskflow_token');
      if (!token) return;
      const response = await api.acceptMemberInvitation(token, boardId) as { data: any };

      // Update local state with the refreshed board data
      set((state) => ({
        boards: state.boards.map((b) => (b.id === boardId ? {
          ...b,
          members: response.data.members.map((m: any) => ({
            ...m,
            id: m.id || m._id
          }))
        } : b)),
      }));

      // Refresh boards
      get().fetchBoards();
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  rejectMemberInvitation: async (boardId) => {
    try {
      const token = localStorage.getItem('taskflow_token');
      if (!token) return;
      await api.rejectMemberInvitation(token, boardId);

      // Refresh boards to reflect that we are no longer invited/associated
      get().fetchBoards();
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  removeMember: async (boardId, memberId) => {
    try {
      const token = localStorage.getItem('taskflow_token');
      if (!token) return;
      await api.removeMember(token, boardId, memberId);

      const updateBoards = (boards: Board[]) =>
        boards.map((b) => {
          if (b.id !== boardId) return b;
          return {
            ...b,
            members: b.members.filter((m) => m.id !== memberId),
          };
        });

      set((state) => ({
        boards: updateBoards(state.boards),
        publicBoards: updateBoards(state.publicBoards),
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  updateMemberRole: async (boardId, memberId, role) => {
    try {
      const token = localStorage.getItem('taskflow_token');
      if (!token) return;
      await api.updateMemberRole(token, boardId, memberId, role);

      const updateBoards = (boards: Board[]) =>
        boards.map((b) => {
          if (b.id !== boardId) return b;
          return {
            ...b,
            members: b.members.map((m) =>
              (m.id === memberId || (m as any)._id === memberId) ? { ...m, role } : m
            ),
          };
        });

      set((state) => ({
        boards: updateBoards(state.boards),
        publicBoards: updateBoards(state.publicBoards),
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  checkDeadlines: () => {
    const { tasks } = get();
    const now = new Date();

    Object.values(tasks).forEach((task) => {
      if (task.dueDate && task.status !== 'done') {
        const dueDate = new Date(task.dueDate);
        const diffInHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (diffInHours > 0 && diffInHours <= 24) {
          const alreadyNotified = get().notifications.some(
            (n) => n.taskId === task.id && n.type === 'task_deadline'
          );

          if (!alreadyNotified) {
            toast.warning(`Task Deadline: "${task.title}" is due tomorrow!`, {
              duration: 5000,
            });
          }
        }
      }
    });
  },

  initializeSocket: (token, userId) => {
    socketService.connect(token);
    socketService.joinUser(userId);

    const currentBoardId = get().currentBoardId;
    if (currentBoardId) {
      socketService.joinBoard(currentBoardId);
    }

    // Set up listeners
    socketService.on('new_notification', (notif) => {
      const notification = {
        ...notif,
        id: String(notif.id || notif._id),
        userId: String(notif.userId)
      };
      set((state) => ({
        notifications: [notification, ...state.notifications]
      }));

      // Play sound based on user settings
      playNotificationWithSettings(notification.userId);

      // Show toast for new notification
      toast.info(notification.message, {
        description: format(new Date(notification.createdAt), 'MMM d, h:mm a'),
        duration: 5000,
      });
    });

    socketService.on('new_comment', (commentData) => {
      const comment = {
        ...commentData,
        id: String(commentData.id || commentData._id),
        taskId: String(commentData.taskId),
        userId: String(commentData.userId)
      };
      const { tasks, currentBoardId } = get();
      // Only process if it's for an active task we have
      if (tasks[comment.taskId]) {
        set((state) => ({
          tasks: {
            ...state.tasks,
            [comment.taskId]: {
              ...state.tasks[comment.taskId],
              commentsCount: (state.tasks[comment.taskId].commentsCount || 0) + 1
            }
          }
        }));
      }
      // Notify components watching for new comments (e.g., TaskDetailModal)
      window.dispatchEvent(new CustomEvent('new_comment_received', { detail: comment }));
    });

    socketService.on('task_created', (taskData) => {
      const task = {
        ...taskData,
        id: String(taskData.id || taskData._id),
        boardId: String(taskData.boardId)
      };
      if (task.boardId === get().currentBoardId) {
        get().fetchTasks(task.boardId);
      }
    });

    socketService.on('task_updated', (taskData) => {
      const task = {
        ...taskData,
        id: taskData._id || taskData.id
      };
      if (task.boardId === get().currentBoardId) {
        set((state) => ({
          tasks: {
            ...state.tasks,
            [task.id]: { ...state.tasks[task.id], ...task }
          }
        }));
      }
    });

    socketService.on('task_deleted', (taskId) => {
      const { tasks, boards, currentBoardId } = get();
      if (!tasks[taskId]) return;

      const updatedTasks = { ...tasks };
      delete updatedTasks[taskId];

      set((state) => ({
        tasks: updatedTasks,
        boards: state.boards.map(b => {
          if (b.id !== currentBoardId) return b;
          return {
            ...b,
            columns: b.columns.map(col => ({
              ...col,
              taskIds: col.taskIds.filter(id => id !== taskId)
            }))
          };
        })
      }));
    });

    socketService.on('board_updated', (boardData) => {
      const board = {
        ...boardData,
        id: boardData._id || boardData.id,
        title: boardData.name,
      };

      set((state) => ({
        boards: state.boards.map(b => b.id === board.id ? { ...b, ...board } : b),
        publicBoards: state.publicBoards.map(b => b.id === board.id ? { ...b, ...board } : b),
      }));
    });

    socketService.on('you_were_removed', (data: { boardId: string, boardName: string }) => {
      const state = get();

      // Remove board from list
      const newBoards = state.boards.filter((b) => b.id !== data.boardId);
      set({ boards: newBoards });

      // If viewing that board, boot the user out
      if (state.currentBoardId === data.boardId) {
        set({ currentBoardId: null });
        toast.error(`You have been removed from "${data.boardName}"`);
      }
    });

    socketService.on('board_deleted', (boardId) => {
      const state = get();
      const newBoards = state.boards.filter((b) => b.id !== boardId);

      set({ boards: newBoards });

      if (state.currentBoardId === boardId) {
        set({ currentBoardId: null });
        toast.error('The board you were viewing has been deleted');
      }
    });
  },

  handleRealTimeEvent: (event, data) => { },

  fetchComments: async (taskId: string) => {
    try {
      const token = localStorage.getItem('taskflow_token');
      if (!token) throw new Error('No token found');
      const response = await api.fetchComments(token, taskId) as { data: any[] };
      return response.data.map((c: any) => ({
        ...c,
        id: String(c.id || c._id),
        taskId: String(c.taskId),
        userId: String(c.userId)
      }));
    } catch (error: any) {
      console.error('Fetch comments error:', error);
      throw error;
    }
  },

  addComment: async (taskId: string, text: string, options = {}) => {
    try {
      const token = localStorage.getItem('taskflow_token');
      if (!token) throw new Error('No token found');
      await api.addComment(token, taskId, { text, ...options });

      // Update local task comment count (optimistic, but socket will also update)
      const currentTasks = { ...get().tasks };
      if (currentTasks[taskId]) {
        currentTasks[taskId] = {
          ...currentTasks[taskId],
          commentsCount: (currentTasks[taskId].commentsCount || 0) + 1
        };
        set({ tasks: currentTasks });
      }

      get().fetchNotifications();
    } catch (error: any) {
      console.error('Add comment error:', error);
      throw error;
    }
  },

  updateComment: async (commentId: string, text: string) => {
    try {
      const token = localStorage.getItem('taskflow_token');
      if (!token) throw new Error('No token found');
      await api.updateComment(token, commentId, { text });
      // Trigger comment reload via event
      window.dispatchEvent(new CustomEvent('comment_updated'));
      toast.success('Comment updated');
    } catch (error: any) {
      console.error('Update comment error:', error);
      toast.error('Failed to update comment');
      throw error;
    }
  },

  deleteComment: async (commentId: string) => {
    try {
      const token = localStorage.getItem('taskflow_token');
      if (!token) throw new Error('No token found');
      await api.deleteComment(token, commentId);
      // Trigger comment reload via event
      window.dispatchEvent(new CustomEvent('comment_deleted'));
      toast.success('Comment deleted');
    } catch (error: any) {
      console.error('Delete comment error:', error);
      toast.error('Failed to delete comment');
      throw error;
    }
  },

  getCurrentBoard: () => {
    const { boards, publicBoards, currentBoardId } = get();
    return boards.find((b) => b.id === currentBoardId) || publicBoards.find((b) => b.id === currentBoardId) || null;
  },
}));

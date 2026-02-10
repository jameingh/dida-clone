import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '../services';
import { Task, RepeatRule } from '../types';

export function useTasks(listId?: string, tagId?: string) {
  return useQuery({
    queryKey: ['tasks', listId, tagId],
    queryFn: () => {
      if (tagId) {
        return taskService.getTasksByTag(tagId);
      }
      return taskService.getTasks(listId);
    },
  });
}

export function useTask(taskId: string) {
  return useQuery({
    queryKey: ['task', taskId],
    queryFn: () => taskService.getTask(taskId),
    enabled: !!taskId,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (task: Task) => taskService.createTask(task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useCreateTaskSimple() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ title, listId }: { title: string; listId: string }) =>
      taskService.createTaskSimple(title, listId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useCreateTaskExtended() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      title,
      listId,
      dueDate,
      reminder,
      repeat_rule,
      priority,
      tags,
      description
    }: {
      title: string;
      listId: string;
      dueDate?: number;
      reminder?: string;
      repeat_rule?: RepeatRule;
      priority?: number;
      tags?: string[];
      description?: string;
    }) =>
      taskService.createTaskExtended(title, listId, dueDate, reminder, repeat_rule, priority, tags, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useSubtasks(parentId: string) {
  return useQuery({
    queryKey: ['subtasks', parentId],
    queryFn: () => taskService.getSubtasks(parentId),
    enabled: !!parentId,
  });
}

export function useCreateSubtaskSimple() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ title, parentId, listId }: { title: string; parentId: string; listId: string }) =>
      taskService.createSubtaskSimple(title, parentId, listId),
    onSuccess: (newSubtask) => {
      // 立即更新缓存
      queryClient.setQueryData(['task', newSubtask.id], newSubtask);
      
      if (newSubtask.parent_id) {
        queryClient.setQueryData(['subtasks', newSubtask.parent_id], (oldData: Task[] | undefined) => {
          if (!oldData) return [newSubtask];
          return [...oldData, newSubtask];
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['subtasks', newSubtask.parent_id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useUpdateTaskOrders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orders: [string, number][]) => taskService.updateTaskOrders(orders),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['subtasks'] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (task: Task) => taskService.updateTask(task),
    onSuccess: (updatedTask) => {
      // 立即更新缓存
      queryClient.setQueryData(['task', updatedTask.id], updatedTask);
      
      queryClient.setQueriesData({ queryKey: ['tasks'] }, (oldData: Task[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(t => t.id === updatedTask.id ? updatedTask : t);
      });

      if (updatedTask.parent_id) {
        queryClient.setQueryData(['subtasks', updatedTask.parent_id], (oldData: Task[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map(t => t.id === updatedTask.id ? updatedTask : t);
        });
      }

      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['subtasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', updatedTask.id] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => taskService.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['subtasks'] });
    },
  });
}

export function useUndoDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => taskService.undoDeleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['subtasks'] });
    },
  });
}

export function useDeleteTaskPermanently() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => taskService.deleteTaskPermanently(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['subtasks'] });
    },
  });
}

export function useEmptyTrash() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => taskService.emptyTrash(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['subtasks'] });
    },
  });
}

export function useToggleTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => taskService.toggleTask(taskId),
    onSuccess: (updatedTask) => {
      console.log('Task toggled SUCCESS:', updatedTask.id, updatedTask.title, updatedTask.completed);
      
      // 更新特定任务的缓存，防止标题丢失
      queryClient.setQueryData(['task', updatedTask.id], updatedTask);
      
      // 更新列表中的任务
      queryClient.setQueriesData({ queryKey: ['tasks'] }, (oldData: Task[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(t => t.id === updatedTask.id ? updatedTask : t);
      });

      // 如果有父任务，更新父任务的子任务列表
      if (updatedTask.parent_id) {
        queryClient.setQueryData(['subtasks', updatedTask.parent_id], (oldData: Task[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map(t => t.id === updatedTask.id ? updatedTask : t);
        });
      }

      // 如果是完成操作，可能影响了子任务状态，需要失效该任务的子任务查询
      if (updatedTask.completed) {
        queryClient.invalidateQueries({ queryKey: ['subtasks', updatedTask.id] });
      }

      // 仍然失效相关查询以确保数据最终一致性，但现在我们有了即时的缓存更新
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['subtasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', updatedTask.id] });
    },
  });
}

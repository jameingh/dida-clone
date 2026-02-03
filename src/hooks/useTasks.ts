import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '../services';
import { Task } from '../types';

export function useTasks(listId?: string) {
  return useQuery({
    queryKey: ['tasks', listId],
    queryFn: () => taskService.getTasks(listId),
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', variables.parentId] });
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (variables.parent_id) {
        queryClient.invalidateQueries({ queryKey: ['subtasks', variables.parent_id] });
      }
      queryClient.invalidateQueries({ queryKey: ['task', variables.id] });
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

export function useToggleTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => taskService.toggleTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['subtasks'] });
      queryClient.invalidateQueries({ queryKey: ['task'] });
    },
  });
}

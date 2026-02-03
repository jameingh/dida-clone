import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listService } from '../services';
import { List } from '../types';

export function useLists() {
  return useQuery({
    queryKey: ['lists'],
    queryFn: () => listService.getLists(),
  });
}

export function useList(listId: string) {
  return useQuery({
    queryKey: ['list', listId],
    queryFn: () => listService.getList(listId),
    enabled: !!listId,
  });
}

export function useCreateList() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (list: List) => listService.createList(list),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });
}

export function useUpdateList() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (list: List) => listService.updateList(list),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });
}

export function useDeleteList() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (listId: string) => listService.deleteList(listId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });
}

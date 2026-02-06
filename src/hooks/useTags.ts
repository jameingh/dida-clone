import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tagService } from '../services/tag';
import { Tag } from '../types';

export function useTags() {
    return useQuery({
        queryKey: ['tags'],
        queryFn: () => tagService.getTags(),
    });
}

export function useCreateTag() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ name, color, parentId }: { name: string; color: string; parentId?: string | null }) => 
            tagService.createTag(name, color, parentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tags'] });
        },
    });
}

export function useUpdateTag() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (tag: Tag) => tagService.updateTag(tag),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tags'] });
        },
    });
}

export function useDeleteTag() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (tagId: string) => tagService.deleteTag(tagId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tags'] });
            // 删除标签后，任务中的标签关联也会被删除，所以需要刷新任务列表
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['task'] });
        },
    });
}

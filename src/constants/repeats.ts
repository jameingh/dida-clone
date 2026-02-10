import { RepeatType } from '../types/task';

export const REPEAT_OPTIONS = [
  { label: '不重复', value: RepeatType.None },
  { label: '每天', value: RepeatType.Daily },
  { label: '每周', value: RepeatType.Weekly },
  { label: '每月', value: RepeatType.Monthly },
  { label: '每年', value: RepeatType.Yearly },
  { label: '工作日', value: RepeatType.Weekday },
  { label: '自定义', value: RepeatType.Custom },
];

export const REPEAT_TYPE_LABELS: Record<string, string> = {
  [RepeatType.None]: '不重复',
  [RepeatType.Daily]: '每天',
  [RepeatType.Weekly]: '每周',
  [RepeatType.Monthly]: '每月',
  [RepeatType.Yearly]: '每年',
  [RepeatType.Weekday]: '工作日',
  [RepeatType.Custom]: '自定义',
};

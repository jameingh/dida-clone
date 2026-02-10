export const REMINDER_OFFSETS: Record<string, number> = {
  'on_time': 0,
  '5m_before': 5 * 60,
  '30m_before': 30 * 60,
  '1h_before': 60 * 60,
  '1d_before': 24 * 60 * 60,
};

export const REMINDER_OPTIONS = [
  { label: '不提醒', value: 'none' },
  { label: '准时', value: 'on_time' },
  { label: '提前 5 分钟', value: '5m_before' },
  { label: '提前 30 分钟', value: '30m_before' },
  { label: '提前 1 小时', value: '1h_before' },
  { label: '提前 1 天', value: '1d_before' },
];

export const SNOOZE_OPTIONS = [
  { label: '15分钟', minutes: 15 },
  { label: '30分钟', minutes: 30 },
  { label: '1小时', minutes: 60 },
  { label: '3小时', minutes: 180 },
  { label: '今天傍晚', minutes: 'evening' },
  { label: '明天', minutes: 'tomorrow' },
];

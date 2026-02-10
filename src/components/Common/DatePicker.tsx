import { useState, useRef, useEffect } from 'react';
import {
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    format,
    isSameDay,
    isToday,
    addMonths,
    subMonths,
    startOfWeek,
    endOfWeek,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { 
    ChevronLeft, 
    ChevronRight, 
    Sun, 
    CalendarRange, 
    CalendarDays, 
    Moon,
    Clock,
    Bell,
    RefreshCw,
    Circle,
    Check,
    X
} from 'lucide-react';

import { useClickOutside } from '../../hooks/useClickOutside';
import { REMINDER_OPTIONS } from '../../constants/reminders';

interface DatePickerProps {
    selectedDate?: number; // Unix timestamp
    reminder?: string; // 提醒设置，如 "none", "on_time", "5m_before", etc.
    onSelect: (timestamp: number | undefined, reminder?: string) => void;
}

export default function DatePicker({ selectedDate, reminder: initialReminder, onSelect }: DatePickerProps) {
    const [viewDate, setViewDate] = useState(
        selectedDate ? new Date(selectedDate * 1000) : new Date()
    );
    const [selectedTime, setSelectedTime] = useState(() => {
        if (selectedDate) {
            const date = new Date(selectedDate * 1000);
            return { hour: date.getHours(), minute: date.getMinutes() };
        }
        return { hour: 21, minute: 0 }; // 默认初始值为 21:00
    });
    const [tempSelectedDate, setTempSelectedDate] = useState<Date>(
        selectedDate ? new Date(selectedDate * 1000) : new Date()
    );
    const [activeTab, setActiveTab] = useState<'date' | 'range'>('date');
    const [isTimeSet, setIsTimeSet] = useState(!!selectedDate);
    const [showTimeList, setShowTimeList] = useState(false);
    const [showReminderList, setShowReminderList] = useState(false);
    const [selectedReminder, setSelectedReminder] = useState(initialReminder || 'none');
    
    const hourInputRef = useRef<HTMLInputElement>(null);
    const minuteInputRef = useRef<HTMLInputElement>(null);
    const timeListRef = useRef<HTMLDivElement>(null);
    const reminderListRef = useRef<HTMLDivElement>(null);

    // 点击外部隐藏列表
    useClickOutside([timeListRef, hourInputRef, minuteInputRef], () => setShowTimeList(false), showTimeList);
    useClickOutside([reminderListRef], () => setShowReminderList(false), showReminderList);

    // 弹窗打开时，自动滚动到选中项
    useEffect(() => {
        if (showTimeList && timeListRef.current) {
            const selectedItem = timeListRef.current.querySelector('[data-selected="true"]');
            if (selectedItem) {
                selectedItem.scrollIntoView({ block: 'center', behavior: 'auto' });
            }
        }
    }, [showTimeList]);

    // 当设置时间显示时，自动聚焦到小时输入框
    useEffect(() => {
        if (isTimeSet) {
            // 使用 setTimeout 确保输入框已渲染并可见
            const timer = setTimeout(() => {
                if (hourInputRef.current) {
                    hourInputRef.current.focus();
                    hourInputRef.current.select();
                }
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [isTimeSet]);

    // 快捷选项
    const quickOptions = [
        { label: '今天', icon: Sun, days: 0 },
        { label: '明天', icon: CalendarRange, days: 1 },
        { label: '下周', icon: CalendarDays, days: 7 },
        { label: '晚上', icon: Moon, days: 0, time: { hour: 21, minute: 0 } },
    ];

    const handleQuickSelect = (days: number, time?: { hour: number, minute: number }) => {
        const date = new Date();
        date.setDate(date.getDate() + days);
        const finalTime = time || selectedTime;
        date.setHours(finalTime.hour, finalTime.minute, 0, 0);
        if (time) {
            setSelectedTime(time);
            setIsTimeSet(true);
            // 点击设置时间时，如果当前没有提醒，默认设为“准时”
            if (selectedReminder === 'none') {
                setSelectedReminder('on_time');
            }
        }
        onSelect(Math.floor(date.getTime() / 1000));
    };

    // 生成时间列表 (30分钟间隔)
    const timeOptions = Array.from({ length: 48 }, (_, i) => {
        const hour = Math.floor(i / 2);
        const minute = i % 2 === 0 ? 0 : 30;
        return { hour, minute };
    });

    const handleTimeSelect = (hour: number, minute: number) => {
        setSelectedTime({ hour, minute });
        setIsTimeSet(true);
        // 点击选择时间时，如果当前没有提醒，默认设为“准时”
        if (selectedReminder === 'none') {
            setSelectedReminder('on_time');
        }
        setShowTimeList(false);
    };

    const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 2) val = val.slice(-2);
        const num = parseInt(val);
        
        if (val.length === 2) {
            const hour = Math.min(Math.max(num, 0), 23);
            setSelectedTime(prev => ({ ...prev, hour }));
            setIsTimeSet(true);
            // 设置时间时，如果当前没有提醒，默认设为“准时”
            if (selectedReminder === 'none') {
                setSelectedReminder('on_time');
            }
            minuteInputRef.current?.focus();
            minuteInputRef.current?.select();
        } else {
            // 允许输入 1 位数
            setSelectedTime(prev => ({ ...prev, hour: num || 0 }));
            setIsTimeSet(true);
            if (selectedReminder === 'none') {
                setSelectedReminder('on_time');
            }
        }
    };

    const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 2) val = val.slice(-2);
        const num = parseInt(val);

        if (val.length === 2) {
            const minute = Math.min(Math.max(num, 0), 59);
            setSelectedTime(prev => ({ ...prev, minute }));
            setIsTimeSet(true);
            // 设置时间时，如果当前没有提醒，默认设为“准时”
            if (selectedReminder === 'none') {
                setSelectedReminder('on_time');
            }
            hourInputRef.current?.focus();
            hourInputRef.current?.select();
        } else {
            // 允许输入 1 位数
            setSelectedTime(prev => ({ ...prev, minute: num || 0 }));
            setIsTimeSet(true);
            if (selectedReminder === 'none') {
                setSelectedReminder('on_time');
            }
        }
    };

    // 获取当月的所有日期（包含前后月份的部分日期以填充网格）
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(viewDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // 周日开始
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const handleDateClick = (date: Date) => {
        setTempSelectedDate(date);
    };

    const handleConfirm = () => {
        const finalDate = new Date(tempSelectedDate);
        if (isTimeSet) {
            finalDate.setHours(selectedTime.hour, selectedTime.minute, 0, 0);
        } else {
            // 如果没设置时间，默认 00:00:00，后端或前端列表展示会根据是否有时间位来判断
            finalDate.setHours(0, 0, 0, 0);
        }
        onSelect(Math.floor(finalDate.getTime() / 1000), selectedReminder);
    };

    const handleClear = () => {
        onSelect(undefined, 'none');
    };

    const reminderOptions = REMINDER_OPTIONS;

    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

    return (
        <div 
            className="w-[280px] bg-white shadow-[0_10px_40px_rgba(0,0,0,0.3)] rounded-xl border border-[var(--dida-border-light)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-75 date-picker-container isolation-isolate opacity-100"
            style={{ 
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'translateZ(0)',
                WebkitTransform: 'translateZ(0)',
                backgroundColor: '#ffffff' // 显式确保背景不透明
            }}
        >
            {/* Tab 切换 */}
            <div className="flex p-1 bg-[var(--dida-sidebar)] border-b border-[var(--dida-border-light)]">
                <button
                    type="button"
                    onClick={() => setActiveTab('date')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                        activeTab === 'date' ? 'bg-white text-[var(--dida-text-primary)] shadow-sm' : 'text-[var(--dida-text-tertiary)] hover:text-[var(--dida-text-secondary)]'
                    }`}
                >
                    日期
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('range')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                        activeTab === 'range' ? 'bg-white text-[var(--dida-text-primary)] shadow-sm' : 'text-[var(--dida-text-tertiary)] hover:text-[var(--dida-text-secondary)]'
                    }`}
                >
                    时间段
                </button>
            </div>

            {/* 快捷图标栏 */}
            <div className="flex justify-around py-3 px-2 border-b border-[var(--dida-bg-hover)]">
                {quickOptions.map((option) => (
                    <button
                        key={option.label}
                        type="button"
                        onClick={() => handleQuickSelect(option.days, option.time)}
                        className="group flex flex-col items-center gap-1.5"
                        title={option.label}
                    >
                        <div className="p-2 rounded-full group-hover:bg-[var(--dida-bg-hover)] transition-colors text-[var(--dida-text-tertiary)] group-hover:text-[var(--dida-primary)]">
                            <option.icon className="w-5 h-5" />
                        </div>
                    </button>
                ))}
            </div>

            {/* 月历视图 */}
            <div className="p-4">
                {/* 月份标题和切换 */}
                <div className="flex items-center justify-between mb-4 px-1">
                    <div className="text-[13px] font-bold text-[var(--dida-text-primary)]">
                        {format(viewDate, 'yyyy年M月', { locale: zhCN })}
                    </div>
                    <div className="flex gap-1">
                        <button
                            type="button"
                            onClick={() => setViewDate(subMonths(viewDate, 1))}
                            className="p-1 hover:bg-[var(--dida-bg-hover)] rounded-md transition-colors text-[var(--dida-text-tertiary)] hover:text-[var(--dida-text-secondary)]"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewDate(new Date())}
                            className="p-1 hover:bg-[var(--dida-bg-hover)] rounded-md transition-colors"
                        >
                            <Circle className="w-2 h-2 fill-[var(--dida-text-tertiary)] text-[var(--dida-text-tertiary)] opacity-30" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewDate(addMonths(viewDate, 1))}
                            className="p-1 hover:bg-[var(--dida-bg-hover)] rounded-md transition-colors text-[var(--dida-text-tertiary)] hover:text-[var(--dida-text-secondary)]"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* 星期标题 */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {weekDays.map((day) => (
                        <div key={day} className="text-center text-[10px] text-[var(--dida-text-tertiary)] font-bold uppercase">
                            {day}
                        </div>
                    ))}
                </div>

                {/* 日期网格 */}
                <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day) => {
                        const isCurrentMonth = day.getMonth() === viewDate.getMonth();
                        const isSelected = isSameDay(day, tempSelectedDate);
                        const isTodayDate = isToday(day);

                        return (
                            <button
                                key={day.toISOString()}
                                type="button"
                                onClick={() => handleDateClick(day)}
                                className={`
                                    relative h-8 flex flex-col items-center justify-center text-[12px] rounded-md transition-all
                                    ${!isCurrentMonth ? 'text-[var(--dida-text-tertiary)] opacity-40' : 'text-[var(--dida-text-secondary)] font-medium'}
                                    ${isSelected ? 'bg-[var(--dida-primary)] text-white !font-bold shadow-sm' : 'hover:bg-[var(--dida-bg-hover)]'}
                                    ${isTodayDate && !isSelected ? 'text-[var(--dida-primary)] !font-bold' : ''}
                                `}
                            >
                                <span>{format(day, 'd')}</span>
                                {isTodayDate && !isSelected && (
                                    <div className="absolute bottom-1 w-1 h-1 bg-[var(--dida-primary)] rounded-full" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 底部功能栏 */}
            <div className="px-2 pb-2 space-y-0.5 relative">
                {/* 时间选择行 */}
                <div className="relative">
                    <button 
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            if (!isTimeSet) {
                                setIsTimeSet(true);
                                setShowTimeList(true);
                                // 点击开启时间时，如果当前没有提醒，默认设为“准时”
                                if (selectedReminder === 'none') {
                                    setSelectedReminder('on_time');
                                }
                            } else {
                                setShowTimeList(!showTimeList);
                            }
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-[var(--dida-bg-hover)] rounded-lg group transition-colors text-[var(--dida-text-secondary)]"
                    >
                        <div className="flex items-center gap-3">
                            <Clock className={`w-4 h-4 ${isTimeSet ? 'text-[var(--dida-primary)]' : 'text-[var(--dida-text-tertiary)] group-hover:text-[var(--dida-text-secondary)]'}`} />
                            {isTimeSet ? (
                                <div 
                                    className="flex items-center text-[var(--dida-primary)]" 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowTimeList(true);
                                    }}
                                >
                                    <input
                                        ref={hourInputRef}
                                        type="text"
                                        value={selectedTime.hour.toString().padStart(2, '0')}
                                        onChange={handleHourChange}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }
                                        }}
                                        className="w-5 bg-transparent text-[13px] font-bold text-center outline-none"
                                    />
                                    <span className="mx-0.5 text-[13px] font-bold">:</span>
                                    <input
                                        ref={minuteInputRef}
                                        type="text"
                                        value={selectedTime.minute.toString().padStart(2, '0')}
                                        onChange={handleMinuteChange}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }
                                        }}
                                        className="w-5 bg-transparent text-[13px] font-bold text-center outline-none"
                                    />
                                </div>
                            ) : (
                                <span className="text-[13px]">时间</span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            {isTimeSet ? (
                                <X 
                                    className="w-4 h-4 text-[var(--dida-text-tertiary)] hover:text-[var(--dida-text-secondary)] cursor-pointer" 
                                    onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        setIsTimeSet(false);
                                        setShowTimeList(false);
                                    }}
                                />
                            ) : (
                                <ChevronRight className="w-4 h-4 text-[var(--dida-text-tertiary)]" />
                            )}
                        </div>
                    </button>

                    {/* 时间列表弹窗 */}
                    {showTimeList && (
                        <div 
                            ref={timeListRef}
                            className="absolute bottom-full left-0 w-full mb-1 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.15)] rounded-xl border border-[var(--dida-border-light)] py-1 max-h-[240px] overflow-y-auto z-[60] animate-in slide-in-from-bottom-2 duration-200"
                        >
                            {timeOptions.map(({ hour, minute }) => {
                                const isSelected = selectedTime.hour === hour && selectedTime.minute === minute && isTimeSet;
                                return (
                                    <button
                                        key={`${hour}:${minute}`}
                                        type="button"
                                        data-selected={isSelected}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleTimeSelect(hour, minute);
                                        }}
                                        className={`w-full px-4 py-2 text-left text-[13px] hover:bg-[var(--dida-bg-hover)] transition-colors flex items-center justify-between ${isSelected ? 'text-[var(--dida-primary)] bg-[rgba(var(--dida-primary-rgb),0.1)]' : 'text-[var(--dida-text-secondary)]'}`}
                                    >
                                        <span>{`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`}</span>
                                        {isSelected && <Check className="w-4 h-4" />}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 提醒行 */}
                <div className="relative">
                    <button 
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            setShowReminderList(!showReminderList);
                            setShowTimeList(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-[var(--dida-bg-hover)] rounded-lg group transition-colors text-[var(--dida-text-secondary)]"
                    >
                        <div className="flex items-center gap-3">
                            <Bell className={`w-4 h-4 ${selectedReminder !== 'none' ? 'text-[var(--dida-primary)]' : 'text-[var(--dida-text-tertiary)] group-hover:text-[var(--dida-text-secondary)]'}`} />
                            <span className={`text-[13px] ${selectedReminder !== 'none' ? 'text-[var(--dida-primary)] font-medium' : ''}`}>
                                {reminderOptions.find(o => o.value === selectedReminder)?.label || '提醒'}
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            {selectedReminder !== 'none' ? (
                                <X 
                                    className="w-4 h-4 text-[var(--dida-text-tertiary)] hover:text-[var(--dida-text-secondary)] cursor-pointer"
                                    onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        setSelectedReminder('none');
                                        setShowReminderList(false);
                                    }}
                                />
                            ) : (
                                <ChevronRight className="w-4 h-4 text-[var(--dida-text-tertiary)]" />
                            )}
                        </div>
                    </button>

                    {/* 提醒列表弹窗 */}
                    {showReminderList && (
                        <div 
                            ref={reminderListRef}
                            className="absolute bottom-full left-0 w-full mb-1 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.15)] rounded-xl border border-[var(--dida-border-light)] py-1 z-[60] animate-in slide-in-from-bottom-2 duration-200"
                        >
                            <div className="max-h-[240px] overflow-y-auto">
                                {reminderOptions.map((option) => {
                                    const isSelected = selectedReminder === option.value;
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setSelectedReminder(option.value);
                                                setShowReminderList(false);
                                            }}
                                            className={`w-full px-4 py-2 text-left text-[13px] hover:bg-[var(--dida-bg-hover)] transition-colors flex items-center justify-between ${isSelected ? 'text-[var(--dida-primary)] bg-[rgba(var(--dida-primary-rgb),0.1)]' : 'text-[var(--dida-text-secondary)]'}`}
                                        >
                                            <span>{option.label}</span>
                                            {isSelected && <Check className="w-4 h-4" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* 重复行 */}
                <button
                    type="button"
                    onClick={(e) => e.preventDefault()}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-[var(--dida-bg-hover)] rounded-lg group transition-colors text-[var(--dida-text-secondary)]"
                >
                    <div className="flex items-center gap-3">
                        <RefreshCw className="w-4 h-4 text-[var(--dida-text-tertiary)] group-hover:text-[var(--dida-text-secondary)]" />
                        <span className="text-[13px]">重复</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-[13px] text-[var(--dida-text-tertiary)]">无</span>
                        <ChevronRight className="w-4 h-4 text-[var(--dida-text-tertiary)]" />
                    </div>
                </button>
            </div>

            {/* 操作按钮区 */}
            <div className="flex gap-2 p-2 pt-0">
                <button
                    type="button"
                    onClick={handleClear}
                    className="flex-1 py-2 text-[13px] font-medium text-[var(--dida-text-secondary)] hover:bg-[var(--dida-bg-hover)] rounded-lg transition-colors"
                >
                    清除
                </button>
                <button
                    type="button"
                    onClick={handleConfirm}
                    className="flex-1 py-2 text-[13px] font-bold text-white bg-[var(--dida-primary)] hover:brightness-110 rounded-lg transition-all shadow-sm shadow-blue-200"
                >
                    确定
                </button>
            </div>
        </div>
    );
}


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
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            
            // 检查时间列表
            const isInsideTimeInput = hourInputRef.current?.contains(target) || minuteInputRef.current?.contains(target);
            if (timeListRef.current && !timeListRef.current.contains(target) && !isInsideTimeInput) {
                setShowTimeList(false);
            }

            // 检查提醒列表
            if (reminderListRef.current && !reminderListRef.current.contains(target)) {
                setShowReminderList(false);
            }
        };

        if (showTimeList || showReminderList) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showTimeList, showReminderList]);

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
            minuteInputRef.current?.focus();
            minuteInputRef.current?.select();
        } else {
            // 允许输入 1 位数
            setSelectedTime(prev => ({ ...prev, hour: num || 0 }));
            setIsTimeSet(true);
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
            hourInputRef.current?.focus();
            hourInputRef.current?.select();
        } else {
            // 允许输入 1 位数
            setSelectedTime(prev => ({ ...prev, minute: num || 0 }));
            setIsTimeSet(true);
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

    const reminderOptions = [
        { value: 'none', label: '无' },
        { value: 'on_time', label: '准时' },
        { value: '5m_before', label: '提前5分钟' },
        { value: '30m_before', label: '提前30分钟' },
        { value: '1h_before', label: '提前1小时' },
        { value: '1d_before', label: '提前1天' },
        { value: 'custom', label: '自定义' },
    ];

    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

    return (
        <div className="w-[280px] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.15)] rounded-xl border border-gray-100 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200 date-picker-container">
            {/* Tab 切换 */}
            <div className="flex p-1 bg-gray-50/50 border-b border-gray-100">
                <button
                    type="button"
                    onClick={() => setActiveTab('date')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                        activeTab === 'date' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                    日期
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('range')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                        activeTab === 'range' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                    时间段
                </button>
            </div>

            {/* 快捷图标栏 */}
            <div className="flex justify-around py-3 px-2 border-b border-gray-50">
                {quickOptions.map((option) => (
                    <button
                        key={option.label}
                        type="button"
                        onClick={() => handleQuickSelect(option.days, option.time)}
                        className="group flex flex-col items-center gap-1.5"
                        title={option.label}
                    >
                        <div className="p-2 rounded-full group-hover:bg-gray-100 transition-colors text-gray-500 group-hover:text-[#1890FF]">
                            <option.icon className="w-5 h-5" />
                        </div>
                    </button>
                ))}
            </div>

            {/* 月历视图 */}
            <div className="p-4">
                {/* 月份标题和切换 */}
                <div className="flex items-center justify-between mb-4 px-1">
                    <div className="text-[13px] font-bold text-gray-800">
                        {format(viewDate, 'yyyy年M月', { locale: zhCN })}
                    </div>
                    <div className="flex gap-1">
                        <button
                            type="button"
                            onClick={() => setViewDate(subMonths(viewDate, 1))}
                            className="p-1 hover:bg-gray-100 rounded-md transition-colors text-gray-400 hover:text-gray-600"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewDate(new Date())}
                            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                        >
                            <Circle className="w-2 h-2 fill-gray-300 text-gray-300" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewDate(addMonths(viewDate, 1))}
                            className="p-1 hover:bg-gray-100 rounded-md transition-colors text-gray-400 hover:text-gray-600"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* 星期标题 */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {weekDays.map((day) => (
                        <div key={day} className="text-center text-[10px] text-gray-400 font-bold uppercase">
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
                                    ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-700 font-medium'}
                                    ${isSelected ? 'bg-[#1890FF] text-white !font-bold shadow-sm' : 'hover:bg-gray-100'}
                                    ${isTodayDate && !isSelected ? 'text-[#1890FF] !font-bold' : ''}
                                `}
                            >
                                <span>{format(day, 'd')}</span>
                                {isTodayDate && !isSelected && (
                                    <div className="absolute bottom-1 w-1 h-1 bg-[#1890FF] rounded-full" />
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
                            } else {
                                setShowTimeList(!showTimeList);
                            }
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded-lg group transition-colors text-gray-600"
                    >
                        <div className="flex items-center gap-3">
                            <Clock className={`w-4 h-4 ${isTimeSet ? 'text-[#1890FF]' : 'text-gray-400 group-hover:text-gray-600'}`} />
                            {isTimeSet ? (
                                <div 
                                    className="flex items-center text-[#1890FF]" 
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
                                    className="w-4 h-4 text-gray-300 hover:text-gray-500 cursor-pointer" 
                                    onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        setIsTimeSet(false);
                                        setShowTimeList(false);
                                    }}
                                />
                            ) : (
                                <ChevronRight className="w-4 h-4 text-gray-300" />
                            )}
                        </div>
                    </button>

                    {/* 时间列表弹窗 */}
                    {showTimeList && (
                        <div 
                            ref={timeListRef}
                            className="absolute bottom-full left-0 w-full mb-1 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.15)] rounded-xl border border-gray-100 py-1 max-h-[240px] overflow-y-auto z-[60] animate-in slide-in-from-bottom-2 duration-200"
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
                                        className={`w-full px-4 py-2 text-left text-[13px] hover:bg-gray-50 transition-colors flex items-center justify-between ${isSelected ? 'text-[#1890FF] bg-blue-50/50' : 'text-gray-600'}`}
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
                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded-lg group transition-colors text-gray-600"
                    >
                        <div className="flex items-center gap-3">
                            <Bell className={`w-4 h-4 ${selectedReminder !== 'none' ? 'text-[#1890FF]' : 'text-gray-400 group-hover:text-gray-600'}`} />
                            <span className={`text-[13px] ${selectedReminder !== 'none' ? 'text-[#1890FF] font-medium' : ''}`}>
                                {reminderOptions.find(o => o.value === selectedReminder)?.label || '提醒'}
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            {selectedReminder !== 'none' ? (
                                <X 
                                    className="w-4 h-4 text-gray-300 hover:text-gray-500 cursor-pointer"
                                    onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        setSelectedReminder('none');
                                        setShowReminderList(false);
                                    }}
                                />
                            ) : (
                                <ChevronRight className="w-4 h-4 text-gray-300" />
                            )}
                        </div>
                    </button>

                    {/* 提醒列表弹窗 */}
                    {showReminderList && (
                        <div 
                            ref={reminderListRef}
                            className="absolute bottom-full left-0 w-full mb-1 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.15)] rounded-xl border border-gray-100 py-1 z-[60] animate-in slide-in-from-bottom-2 duration-200"
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
                                            className={`w-full px-4 py-2 text-left text-[13px] hover:bg-gray-50 transition-colors flex items-center justify-between ${isSelected ? 'text-[#1890FF] bg-blue-50/50' : 'text-gray-600'}`}
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
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded-lg group transition-colors text-gray-600"
                >
                    <div className="flex items-center gap-3">
                        <RefreshCw className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                        <span className="text-[13px]">重复</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-[13px] text-gray-400">无</span>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                    </div>
                </button>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2 p-3 border-t border-gray-50 bg-gray-50/30">
                <button
                    type="button"
                    onClick={handleClear}
                    className="flex-1 py-2 text-[13px] font-medium text-gray-500 hover:bg-white hover:text-gray-700 rounded-lg border border-transparent hover:border-gray-200 transition-all"
                >
                    清除
                </button>
                <button
                    type="button"
                    onClick={handleConfirm}
                    className="flex-1 py-2 text-[13px] font-bold text-white bg-[#1890FF] hover:bg-[#1677D2] rounded-lg shadow-sm transition-all"
                >
                    确定
                </button>
            </div>
        </div>
    );
}


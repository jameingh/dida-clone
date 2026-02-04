import { useState } from 'react';
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
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
    selectedDate?: number; // Unix timestamp
    onSelect: (timestamp: number | undefined) => void;
}

export default function DatePicker({ selectedDate, onSelect }: DatePickerProps) {
    const [viewDate, setViewDate] = useState(
        selectedDate ? new Date(selectedDate * 1000) : new Date()
    );
    const [selectedTime, setSelectedTime] = useState(() => {
        if (selectedDate) {
            const date = new Date(selectedDate * 1000);
            return { hour: date.getHours(), minute: date.getMinutes() };
        }
        return { hour: 21, minute: 0 };
    });
    const [tempSelectedDate, setTempSelectedDate] = useState<Date>(
        selectedDate ? new Date(selectedDate * 1000) : new Date()
    );

    // 快捷选项
    const quickOptions = [
        { label: '☀️ 今天', days: 0 },
        { label: '🌙 明天', days: 1 },
        { label: '📅 下周', days: 7 },
        { label: '📆 下月', days: 30 },
    ];

    const handleQuickSelect = (days: number) => {
        const date = new Date();
        date.setDate(date.getDate() + days);
        date.setHours(selectedTime.hour, selectedTime.minute, 0, 0);
        onSelect(Math.floor(date.getTime() / 1000));
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
        finalDate.setHours(selectedTime.hour, selectedTime.minute, 0, 0);
        onSelect(Math.floor(finalDate.getTime() / 1000));
    };

    const handleClear = () => {
        onSelect(undefined);
    };

    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

    return (
        <div className="w-80 bg-white shadow-xl rounded-lg border border-gray-100 overflow-hidden">
            {/* 快捷选项 */}
            <div className="p-3 border-b border-gray-100">
                <div className="text-xs font-semibold text-gray-400 mb-2">快捷选择</div>
                <div className="grid grid-cols-4 gap-2">
                    {quickOptions.map((option) => (
                        <button
                            key={option.label}
                            type="button"
                            onClick={() => handleQuickSelect(option.days)}
                            className="px-2 py-1.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-[#1890FF] rounded transition-colors"
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 月历视图 */}
            <div className="p-3">
                {/* 月份标题和切换 */}
                <div className="flex items-center justify-between mb-3">
                    <button
                        type="button"
                        onClick={() => setViewDate(subMonths(viewDate, 1))}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4 text-gray-600" />
                    </button>
                    <div className="text-sm font-semibold text-gray-700">
                        {format(viewDate, 'yyyy年M月', { locale: zhCN })}
                    </div>
                    <button
                        type="button"
                        onClick={() => setViewDate(addMonths(viewDate, 1))}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                    </button>
                </div>

                {/* 星期标题 */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {weekDays.map((day) => (
                        <div key={day} className="text-center text-xs text-gray-400 font-medium">
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
                  aspect-square flex items-center justify-center text-sm rounded transition-colors
                  ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
                  ${isSelected ? 'bg-[#1890FF] text-white font-semibold' : ''}
                  ${isTodayDate && !isSelected ? 'bg-blue-50 text-[#1890FF] font-semibold' : ''}
                  ${!isSelected && !isTodayDate ? 'hover:bg-gray-100' : ''}
                `}
                            >
                                {format(day, 'd')}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 时间选择 */}
            <div className="px-3 pb-3 border-t border-gray-100 pt-3">
                <div className="text-xs font-semibold text-gray-400 mb-2">时间</div>
                <div className="flex items-center gap-2">
                    <select
                        value={selectedTime.hour}
                        onChange={(e) => setSelectedTime({ ...selectedTime, hour: parseInt(e.target.value) })}
                        className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-[#1890FF]"
                    >
                        {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i}>
                                {i.toString().padStart(2, '0')}
                            </option>
                        ))}
                    </select>
                    <span className="text-gray-400">:</span>
                    <select
                        value={selectedTime.minute}
                        onChange={(e) => setSelectedTime({ ...selectedTime, minute: parseInt(e.target.value) })}
                        className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-[#1890FF]"
                    >
                        {[0, 15, 30, 45].map((minute) => (
                            <option key={minute} value={minute}>
                                {minute.toString().padStart(2, '0')}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2 p-3 border-t border-gray-100">
                <button
                    type="button"
                    onClick={handleClear}
                    className="flex-1 px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded transition-colors"
                >
                    清除
                </button>
                <button
                    type="button"
                    onClick={handleConfirm}
                    className="flex-1 px-4 py-2 text-sm text-white bg-[#1890FF] hover:bg-[#1677D2] rounded transition-colors"
                >
                    确定
                </button>
            </div>
        </div>
    );
}

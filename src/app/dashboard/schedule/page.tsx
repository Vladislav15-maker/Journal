
"use client";
import { useState, useMemo } from 'react';
import { initialData } from '@/lib/data';
import { AppData, Class, Subject, Lesson, ScheduleItem } from '@/lib/definitions';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, Trash2, PlusCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const daysOfWeek = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];

export default function SchedulePage() {
    const [data, setData] = useState<AppData>(initialData);
    const [schedule, setSchedule] = useState<ScheduleItem[]>(initialData.schedule || []);
    const [selectedClassId, setSelectedClassId] = useState(data.classes[0]?.id || '');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    // Form state for new schedule item
    const [selectedDay, setSelectedDay] = useState('');
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [lessonNumber, setLessonNumber] = useState(1);

    const currentClass = useMemo(() => data.classes.find(c => c.id === selectedClassId), [data.classes, selectedClassId]);
    const classSchedule = useMemo(() => schedule.filter(item => item.classId === selectedClassId), [schedule, selectedClassId]);

    const handleAddScheduleItem = () => {
        if (!selectedDay || !selectedSubjectId || !lessonNumber || !selectedClassId) return;

        const newScheduleItem: ScheduleItem = {
            id: `sch-${new Date().getTime()}`,
            classId: selectedClassId,
            dayOfWeek: selectedDay,
            lessonNumber,
            subjectId: selectedSubjectId
        };
        
        setSchedule(prev => [...prev, newScheduleItem].sort((a,b) => a.lessonNumber - b.lessonNumber));
        setIsDialogOpen(false);
        // Reset form
        setSelectedDay('');
        setSelectedSubjectId('');
        setLessonNumber(1);
    };

    const handleDeleteScheduleItem = (itemId: string) => {
        setSchedule(prev => prev.filter(item => item.id !== itemId));
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarIcon /> Расписание
                    </CardTitle>
                    <CardDescription>
                        Управляйте расписанием уроков для каждого класса.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Класс:</span>
                             <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Выберите класс" />
                                </SelectTrigger>
                                <SelectContent>
                                    {data.classes.map((c: Class) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button disabled={!currentClass}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Добавить урок
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Добавить урок в расписание</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="day" className="text-right">День</Label>
                                        <Select value={selectedDay} onValueChange={setSelectedDay}>
                                            <SelectTrigger id="day" className="col-span-3">
                                                <SelectValue placeholder="Выберите день" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {daysOfWeek.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="lesson-num" className="text-right">Номер урока</Label>
                                        <Select value={String(lessonNumber)} onValueChange={val => setLessonNumber(Number(val))}>
                                            <SelectTrigger id="lesson-num" className="col-span-3">
                                                <SelectValue placeholder="Выберите номер" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[1,2,3,4,5,6,7,8].map(num => <SelectItem key={num} value={String(num)}>{num}-й урок</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="subject" className="text-right">Предмет</Label>
                                        <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                                            <SelectTrigger id="subject" className="col-span-3">
                                                <SelectValue placeholder="Выберите предмет" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {currentClass?.subjects.map(sub => <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleAddScheduleItem}>Добавить</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {daysOfWeek.map(day => (
                            <Card key={day}>
                                <CardHeader>
                                    <CardTitle>{day}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {classSchedule.filter(item => item.dayOfWeek === day).length > 0 ? (
                                        classSchedule.filter(item => item.dayOfWeek === day).map(item => {
                                            const subject = currentClass?.subjects.find(s => s.id === item.subjectId);
                                            return (
                                                <div key={item.id} className="flex items-center justify-between p-2 rounded-md bg-muted">
                                                    <span className="font-medium">{item.lessonNumber}-й урок: {subject?.name || 'Неизвестный предмет'}</span>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteScheduleItem(item.id)}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-sm text-muted-foreground">Нет уроков</p>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                </CardContent>
            </Card>
        </div>
    )
}

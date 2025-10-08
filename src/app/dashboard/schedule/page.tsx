
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Trash2, PlusCircle } from 'lucide-react';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { classes, scheduleItems } from '@/lib/schema';
import { AddScheduleItemDialog } from './_components/schedule-actions';
import { DeleteScheduleItemButton } from './_components/schedule-actions';
import { ScheduleClassSelector } from './_components/schedule-class-selector';

const daysOfWeek = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];

export default async function SchedulePage({ searchParams }: { searchParams: { classId?: string }}) {
    const allClasses = await db.query.classes.findMany({
        with: { subjects: true }
    });

    if (allClasses.length === 0) {
         return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><CalendarIcon /> Расписание</CardTitle>
                    <CardDescription>Нет доступных классов для управления расписанием.</CardDescription>
                </CardHeader>
                 <CardContent>
                    <p className="text-muted-foreground">Пожалуйста, сначала создайте класс на странице "Мои классы".</p>
                </CardContent>
            </Card>
        );
    }

    const selectedClassId = searchParams.classId ? parseInt(searchParams.classId) : allClasses[0].id;
    const currentClass = allClasses.find(c => c.id === selectedClassId);

    const classSchedule = currentClass ? await db.query.scheduleItems.findMany({
        where: eq(scheduleItems.classId, selectedClassId),
        orderBy: (scheduleItems, { asc }) => [asc(scheduleItems.lessonNumber)],
    }) : [];

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
                        <ScheduleClassSelector allClasses={allClasses} selectedClassId={selectedClassId} />
                        <AddScheduleItemDialog currentClass={currentClass} />
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
                                            const subject = currentClass?.subjects?.find(s => s.id === item.subjectId);
                                            return (
                                                <div key={item.id} className="flex items-center justify-between p-2 rounded-md bg-muted">
                                                    <span className="font-medium">{item.lessonNumber}-й урок: {subject?.name || 'Неизвестный предмет'}</span>
                                                    <DeleteScheduleItemButton itemId={item.id} />
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

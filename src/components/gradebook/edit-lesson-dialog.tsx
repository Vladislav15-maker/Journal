
"use client";

import { useState, type ReactNode, useEffect } from 'react';
import { Lesson, lessonTypes, lessonTypeTranslations, LessonType } from '@/lib/definitions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type EditLessonDialogProps = {
    lesson: Lesson;
    onUpdateLesson: (lesson: Lesson) => void;
    children: ReactNode;
};

export function EditLessonDialog({ lesson, onUpdateLesson, children }: EditLessonDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [topic, setTopic] = useState(lesson.topic);
    const [homework, setHomework] = useState(lesson.homework);
    const [lessonType, setLessonType] = useState<LessonType>(lesson.lessonType);
    const [maxPoints, setMaxPoints] = useState(lesson.maxPoints);

    useEffect(() => {
        // Reset state when dialog is opened
        if (isOpen) {
            setTopic(lesson.topic);
            setHomework(lesson.homework);
            setLessonType(lesson.lessonType);
            setMaxPoints(lesson.maxPoints);
        }
    }, [isOpen, lesson]);

    const handleSubmit = () => {
        onUpdateLesson({
            ...lesson,
            topic,
            homework,
            lessonType,
            maxPoints: lessonType !== 'Default' ? maxPoints : undefined,
        });
        setIsOpen(false);
    };
    
    const isSpecialLesson = lessonType !== 'Default';

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Редактировать урок от {new Date(lesson.date + 'T00:00:00Z').toLocaleDateString('ru-RU', { timeZone: 'UTC' })}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="topic" className="text-right">Тема</Label>
                        <Input id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="homework" className="text-right">Д/З</Label>
                        <Textarea id="homework" value={homework} onChange={(e) => setHomework(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="lesson-type" className="text-right">Тип урока</Label>
                        <Select value={lessonType} onValueChange={(value) => setLessonType(value as LessonType)}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Выберите тип урока" />
                            </SelectTrigger>
                            <SelectContent>
                                {lessonTypes.map(type => (
                                    <SelectItem key={type} value={type}>{lessonTypeTranslations[type]}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {isSpecialLesson && (
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="max-points" className="text-right">Max. баллов</Label>
                            <Input 
                                id="max-points"
                                type="number" 
                                value={maxPoints ?? ''} 
                                onChange={(e) => setMaxPoints(e.target.value ? Number(e.target.value) : undefined)} 
                                className="col-span-3" 
                            />
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit}>Сохранить</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

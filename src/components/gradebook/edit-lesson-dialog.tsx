
"use client";

import { useState, type ReactNode, useEffect, useRef } from 'react';
import { Lesson, lessonTypes, lessonTypeTranslations, LessonType } from '@/lib/definitions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateLesson } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useFormStatus } from 'react-dom';

type EditLessonDialogProps = {
    lesson: Lesson;
    children: ReactNode;
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Сохранение...' : 'Сохранить'}
        </Button>
    );
}

export function EditLessonDialog({ lesson, children }: EditLessonDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [lessonType, setLessonType] = useState<LessonType>(lesson.lessonType as LessonType);
    const formRef = useRef<HTMLFormElement>(null);
    const { toast } = useToast();
    
    useEffect(() => {
        if (isOpen) {
            setLessonType(lesson.lessonType as LessonType);
        }
    }, [isOpen, lesson]);

    const handleAction = async (formData: FormData) => {
        const result = await updateLesson(formData);
        if (result?.error) {
            toast({ variant: 'destructive', title: 'Ошибка', description: result.error });
        } else {
            toast({ title: 'Урок обновлен' });
            setIsOpen(false);
        }
    };
    
    const isSpecialLesson = lessonType !== 'Default';

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Редактировать урок от {new Date(lesson.date).toLocaleDateString('ru-RU', { timeZone: 'UTC' })}</DialogTitle>
                </DialogHeader>
                 <form action={handleAction} ref={formRef} className="grid gap-4 py-4">
                    <input type="hidden" name="lessonId" value={lesson.id} />
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="topic" className="text-right">Тема</Label>
                        <Input id="topic" name="topic" defaultValue={lesson.topic} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="homework" className="text-right">Д/З</Label>
                        <Textarea id="homework" name="homework" defaultValue={lesson.homework} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="lesson-type" className="text-right">Тип урока</Label>
                        <Select name="lessonType" value={lessonType} onValueChange={(value) => setLessonType(value as LessonType)}>
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
                                name="maxPoints"
                                type="number" 
                                defaultValue={lesson.maxPoints ?? ''} 
                                className="col-span-3" 
                            />
                        </div>
                    )}
                    <DialogFooter>
                        <SubmitButton />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}


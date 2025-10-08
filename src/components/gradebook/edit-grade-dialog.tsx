
"use client";

import { useState, type ReactNode, useEffect, useRef } from 'react';
import { Grade, Lesson, AttendanceStatus, attendanceStatuses, attendanceStatusTranslations } from '@/lib/definitions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { updateGrade } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useFormStatus } from 'react-dom';

type EditGradeDialogProps = {
    grade: Grade;
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

export function EditGradeDialog({ grade, lesson, children }: EditGradeDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [attendance, setAttendance] = useState<AttendanceStatus>(grade.attendance as AttendanceStatus);
    const formRef = useRef<HTMLFormElement>(null);
    const { toast } = useToast();

    const canSetGrade = attendance === 'present';
    const isExcused = attendance === 'excused';

    const handleAction = async (formData: FormData) => {
        const result = await updateGrade(formData);
        if (result?.error) {
            toast({ variant: 'destructive', title: 'Ошибка', description: result.error });
        } else {
            toast({ title: 'Оценка обновлена' });
            setIsOpen(false);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Оценка за {new Date(lesson.date).toLocaleDateString('ru-RU', { timeZone: 'UTC' })}</DialogTitle>
                </DialogHeader>
                <form action={handleAction} ref={formRef} className="grid gap-6 py-4">
                    <input type="hidden" name="gradeId" value={grade.id} />
                    <input type="hidden" name="studentId" value={grade.studentId} />
                    <input type="hidden" name="lessonId" value={grade.lessonId} />
                    
                     <div className="grid grid-cols-4 items-start gap-4">
                         <Label className="text-right pt-2">Посещ.</Label>
                         <RadioGroup 
                            name="attendance" 
                            value={attendance} 
                            onValueChange={(value) => setAttendance(value as AttendanceStatus)} 
                            className="col-span-3 space-y-2"
                        >
                             {attendanceStatuses.map(status => (
                                <div key={status} className="flex items-center space-x-2">
                                    <RadioGroupItem value={status} id={`status-${status}-${grade.id}`} />
                                    <Label htmlFor={`status-${status}-${grade.id}`}>{attendanceStatusTranslations[status]}</Label>
                                </div>
                             ))}
                        </RadioGroup>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor={`grade-${grade.id}`} className="text-right">Оценка</Label>
                        <Input 
                            id={`grade-${grade.id}`}
                            name="grade"
                            type="number"
                            defaultValue={grade.grade ?? ''} 
                            className="col-span-3"
                            max={lesson.maxPoints ?? 10}
                            disabled={!canSetGrade}
                        />
                    </div>
                     {canSetGrade && lesson.maxPoints && (
                        <div className="col-start-2 col-span-3 text-sm text-muted-foreground -mt-4">
                            Максимум: {lesson.maxPoints} баллов
                        </div>
                    )}
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor={`comment-${grade.id}`} className="text-right">
                           {isExcused ? "Причина" : "Комментарий"}
                        </Label>
                        <Textarea 
                            id={`comment-${grade.id}`}
                            name="comment"
                            defaultValue={grade.comment ?? ''} 
                            className="col-span-3"
                            placeholder={isExcused ? 'Например: "По болезни"' : 'Комментарий к оценке...'}
                        />
                    </div>
                     <DialogFooter>
                        <SubmitButton />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}


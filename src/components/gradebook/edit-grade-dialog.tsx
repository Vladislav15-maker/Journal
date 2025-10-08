
"use client";

import { useState, type ReactNode, useEffect } from 'react';
import { Grade, Lesson, AttendanceStatus, attendanceStatuses, attendanceStatusTranslations } from '@/lib/definitions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

type EditGradeDialogProps = {
    grade: Grade;
    lesson: Lesson;
    onUpdateGrade: (grade: Grade) => void;
    children: ReactNode;
};

export function EditGradeDialog({ grade, lesson, onUpdateGrade, children }: EditGradeDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentGrade, setCurrentGrade] = useState(grade.grade);
    const [attendance, setAttendance] = useState<AttendanceStatus>(grade.attendance);
    const [comment, setComment] = useState(grade.comment);
    
    const canSetGrade = attendance === 'present';
    const maxGrade = lesson.maxPoints ?? 10;
    const isExcused = attendance === 'excused';

    useEffect(() => {
        // Reset state when dialog is opened
        if (isOpen) {
            setCurrentGrade(grade.grade);
            setAttendance(grade.attendance);
            setComment(grade.comment);
        }
    }, [isOpen, grade]);

    useEffect(() => {
        // Clear grade if attendance is not 'present'
        if (attendance !== 'present') {
            setCurrentGrade(undefined);
        }
         // Clear comment if not excused, unless it's a non-attendance comment
        if (attendance !== 'excused' && grade.attendance === 'excused') {
           setComment('');
        }
    }, [attendance, grade.attendance]);

    const handleSubmit = () => {
        let finalGrade = currentGrade;
        if (finalGrade !== undefined) {
            if (finalGrade > maxGrade) finalGrade = maxGrade;
            if (finalGrade < 0) finalGrade = 0;
        }

        onUpdateGrade({
            ...grade,
            grade: canSetGrade ? finalGrade : undefined,
            attendance,
            comment,
        });
        setIsOpen(false);
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Оценка за {new Date(lesson.date + 'T00:00:00Z').toLocaleDateString('ru-RU', { timeZone: 'UTC' })}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                     <div className="grid grid-cols-4 items-start gap-4">
                         <Label className="text-right pt-2">Посещ.</Label>
                         <RadioGroup value={attendance} onValueChange={(value) => setAttendance(value as AttendanceStatus)} className="col-span-3 space-y-2">
                             {attendanceStatuses.map(status => (
                                <div key={status} className="flex items-center space-x-2">
                                    <RadioGroupItem value={status} id={`status-${status}`} />
                                    <Label htmlFor={`status-${status}`}>{attendanceStatusTranslations[status]}</Label>
                                </div>
                             ))}
                        </RadioGroup>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="grade" className="text-right">Оценка</Label>
                        <Input 
                            id="grade" 
                            type="number"
                            value={currentGrade ?? ''} 
                            onChange={(e) => setCurrentGrade(e.target.value ? Number(e.target.value) : undefined)} 
                            className="col-span-3"
                            max={maxGrade}
                            disabled={!canSetGrade}
                        />
                    </div>
                     {canSetGrade && (
                        <div className="col-start-2 col-span-3 text-sm text-muted-foreground -mt-4">
                            Максимум: {maxGrade} баллов
                        </div>
                    )}
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="comment" className="text-right">
                           {isExcused ? "Причина" : "Комментарий"}
                        </Label>
                        <Textarea 
                            id="comment" 
                            value={comment ?? ''} 
                            onChange={(e) => setComment(e.target.value)} 
                            className="col-span-3"
                            placeholder={isExcused ? 'Например: "По болезни"' : 'Комментарий к оценке...'}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit}>Сохранить</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

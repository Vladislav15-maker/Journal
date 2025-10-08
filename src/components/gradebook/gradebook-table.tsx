
import { Student, Lesson, Grade, LessonType, lessonTypeTranslations } from "@/lib/definitions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StudentIcon } from "../icons/student";
import { EditLessonDialog } from "./edit-lesson-dialog";
import { EditGradeDialog } from "./edit-grade-dialog";
import { Send, Check, X, Clock, MessageSquare, Paperclip, PlusCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogFooter } from "../ui/alert-dialog";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import React from "react";
import { createLesson, sendMessage } from "@/lib/actions";

type GradebookTableProps = {
    students: Student[];
    lessons: Lesson[];
    grades: Grade[];
    subjectId: number;
};

const getGradeColorClass = (grade: number | undefined, maxPoints: number | undefined): string => {
    if (grade === undefined || grade === null) return '';

    const effectiveMax = maxPoints ?? 10;
    const percentage = (grade / effectiveMax) * 100;

    if (effectiveMax === 10) {
        if (grade >= 9) return 'text-green-500 font-bold';
        if (grade === 8) return 'text-green-600';
        if (grade >= 5) return 'text-orange-500';
        return 'text-red-600';
    }
    if (effectiveMax === 25) { 
        if (grade >= 22) return 'text-green-500 font-bold';
        if (grade >= 17) return 'text-green-600';
        if (grade >= 8) return 'text-orange-500';
        return 'text-red-600';
    }
     if (effectiveMax === 20) {
        if (grade >= 18) return 'text-green-500 font-bold';
        if (grade >= 16) return 'text-green-600';
        if (grade >= 10) return 'text-orange-500';
        return 'text-red-600';
    }
    if (effectiveMax === 40) {
        if (grade >= 36) return 'text-green-500 font-bold';
        if (grade >= 27) return 'text-green-600';
        if (grade >= 12) return 'text-orange-500';
        return 'text-red-600';
    }
    if (effectiveMax === 50) {
        if (grade >= 43) return 'text-green-500 font-bold';
        if (grade >= 33) return 'text-green-600';
        if (grade >= 15) return 'text-orange-500';
        return 'text-red-600';
    }

    if (percentage >= 85) return 'text-green-500 font-bold';
    if (percentage >= 65) return 'text-green-600';
    if (percentage >= 40) return 'text-orange-500';
    return 'text-red-600';
};


const AttendanceIcon = ({ status }: { status: string }) => {
    switch (status) {
        case 'present': return null;
        case 'absent': return <X className="h-4 w-4 text-red-600" />;
        case 'excused': return <Clock className="h-4 w-4 text-yellow-600" />;
        default: return null;
    }
};

const CommentDialog = ({ comment }: { comment: string }) => {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <button onClick={(e) => e.stopPropagation()} className="p-0 m-0 h-auto bg-transparent">
                     <MessageSquare className="h-4 w-4 text-blue-500" />
                </button>
            </AlertDialogTrigger>
             <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Комментарий</AlertDialogTitle>
                    <AlertDialogDescription>
                        {comment}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Закрыть</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};


const SendMessageDialog = ({ student }: { student: Student }) => {
    const [message, setMessage] = React.useState('');
    const [isOpen, setIsOpen] = React.useState(false);
    const { toast } = useToast();

    const handleSend = async () => {
        const formData = new FormData();
        formData.append('recipient', `student-${student.id}`);
        formData.append('message', message);
        const result = await sendMessage(formData);

        if (result?.error) {
             toast({ variant: 'destructive', title: "Ошибка", description: result.error });
        } else {
             toast({ title: "Сообщение отправлено", description: `Сообщение для ${student.firstName} ${student.lastName} отправлено.` });
            setIsOpen(false);
            setMessage('');
        }
    }

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto">
                            <Send className="h-4 w-4 text-accent" />
                        </Button>
                    </AlertDialogTrigger>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Отправить сообщение</p>
                </TooltipContent>
            </Tooltip>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Сообщение для {student.firstName} {student.lastName}</AlertDialogTitle>
                    <AlertDialogDescription>Введите ваше сообщение. Оно будет видно только этому ученику.</AlertDialogDescription>
                </AlertDialogHeader>
                <Textarea 
                    placeholder="Например: 'Хорошая работа на уроке!'" 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />
                <AlertDialogFooter>
                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSend} disabled={!message.trim()}>Отправить</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

const AddLessonButton = ({ subjectId }: { subjectId: number }) => {
    const { toast } = useToast();

    const handleAddLesson = async () => {
        const result = await createLesson(subjectId);
        if (result.error) {
            toast({ variant: 'destructive', title: "Ошибка", description: result.error });
        } else {
            toast({ title: "Урок создан", description: "Новый урок добавлен в журнал." });
        }
    };

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-full w-14 rounded-none border-l-2 border-dashed" onClick={handleAddLesson}>
                    <PlusCircle />
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>Добавить новый урок</p>
            </TooltipContent>
        </Tooltip>
    );
};


export function GradebookTable({ students, lessons, grades, subjectId }: GradebookTableProps) {

    const formatDate = (dateString: string | Date) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
    }
    
    return (
        <TooltipProvider>
            <div className="w-full overflow-x-auto">
                <Table className="min-w-full border-collapse">
                    <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                            <TableHead className="sticky left-0 bg-background min-w-[200px] z-20">Ученик</TableHead>
                            {lessons.map(lesson => (
                                <TableHead 
                                    key={lesson.id} 
                                    className={cn(
                                        "min-w-[200px] text-center p-0 border-l",
                                        lesson.lessonType !== 'Default' && 'bg-green-100 dark:bg-green-900/30'
                                    )}
                                >
                                    <EditLessonDialog lesson={lesson}>
                                        <div className="cursor-pointer h-full p-2 flex flex-col justify-between hover:bg-muted/80">
                                            <div className="font-bold text-sm">{formatDate(lesson.date)}</div>
                                            <div className="text-xs font-normal text-muted-foreground mt-1 text-wrap">
                                                <p>
                                                    {lesson.topic}
                                                    {lesson.lessonType !== 'Default' && ` (${lessonTypeTranslations[lesson.lessonType as LessonType]})`}
                                                </p>
                                                {lesson.maxPoints && (
                                                    <p className="font-semibold text-accent">Max: {lesson.maxPoints}</p>
                                                )}
                                            </div>
                                            <div className="text-xs text-muted-foreground/80 mt-2 border-t pt-1 text-wrap">
                                                <span className="font-medium">Д/З:</span> {lesson.homework}
                                            </div>
                                        </div>
                                    </EditLessonDialog>
                                </TableHead>
                            ))}
                            <TableHead className="sticky right-0 bg-background z-20 p-0">
                                <AddLessonButton subjectId={subjectId} />
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students?.map(student => (
                            <TableRow key={student.id}>
                                <TableCell className="sticky left-0 bg-background min-w-[200px] z-10 border-r">
                                    <div className="flex items-center gap-2">
                                        <StudentIcon className="h-6 w-6 text-muted-foreground" />
                                        <span>{student.lastName} {student.firstName}</span>
                                        <SendMessageDialog student={student} />
                                    </div>
                                </TableCell>
                                {lessons.map(lesson => {
                                    const grade = grades.find(g => g.studentId === student.id && g.lessonId === lesson.id);
                                    if (!grade) return <TableCell key={`${student.id}-${lesson.id}`} className="border-l"></TableCell>;
                                    
                                    const gradeColorClass = getGradeColorClass(grade.grade ?? undefined, lesson.maxPoints ?? undefined);

                                    return (
                                        <TableCell key={grade.id} className="text-center p-0 border-l">
                                            <EditGradeDialog grade={grade} lesson={lesson}>
                                                <div className="cursor-pointer h-full w-full p-2 flex items-center justify-center gap-2 hover:bg-muted/80 min-h-[60px]">
                                                    <span className={cn("font-bold text-base", gradeColorClass)}>{grade.grade ?? ''}</span>
                                                    <AttendanceIcon status={grade.attendance} />
                                                    {grade.comment && (
                                                        <CommentDialog comment={grade.comment} />
                                                    )}
                                                </div>
                                            </EditGradeDialog>
                                        </TableCell>
                                    );
                                })}
                                 <TableCell className="sticky right-0 bg-background z-10 border-l"></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </TooltipProvider>
    );
}


'use client';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Trash2, PlusCircle } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import { Class } from '@/lib/definitions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addScheduleItem, deleteScheduleItem } from '@/lib/actions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


const daysOfWeek = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];

function SubmitButton({ children }: { children: React.ReactNode }) {
    const { pending } = useFormStatus();
    return <Button type="submit" disabled={pending}>{pending ? 'Добавление...' : children}</Button>;
}


export function AddScheduleItemDialog({ currentClass }: { currentClass?: Class }) {
    const [isOpen, setIsDialogOpen] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);
    const { toast } = useToast();

    const handleAction = async (formData: FormData) => {
        if (!currentClass) return;
        formData.set('classId', String(currentClass.id));

        const result = await addScheduleItem(formData);
        if (result?.error) {
            toast({ variant: 'destructive', title: 'Ошибка', description: result.error });
        } else {
            toast({ title: 'Урок добавлен в расписание' });
            setIsDialogOpen(false);
            formRef.current?.reset();
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button disabled={!currentClass}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Добавить урок
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Добавить урок в расписание для {currentClass?.name}</DialogTitle>
                </DialogHeader>
                <form ref={formRef} action={handleAction} className="space-y-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="dayOfWeek" className="text-right">День</Label>
                         <Select name="dayOfWeek">
                            <SelectTrigger id="dayOfWeek" className="col-span-3">
                                <SelectValue placeholder="Выберите день" />
                            </SelectTrigger>
                            <SelectContent>
                                {daysOfWeek.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="lessonNumber" className="text-right">Номер урока</Label>
                        <Select name="lessonNumber">
                            <SelectTrigger id="lessonNumber" className="col-span-3">
                                <SelectValue placeholder="Выберите номер" />
                            </SelectTrigger>
                            <SelectContent>
                                {[1,2,3,4,5,6,7,8].map(num => <SelectItem key={num} value={String(num)}>{num}-й урок</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="subjectId" className="text-right">Предмет</Label>
                        <Select name="subjectId">
                            <SelectTrigger id="subjectId" className="col-span-3">
                                <SelectValue placeholder="Выберите предмет" />
                            </SelectTrigger>
                            <SelectContent>
                                {currentClass?.subjects.map(sub => <SelectItem key={sub.id} value={String(sub.id)}>{sub.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                       <SubmitButton>Добавить</SubmitButton>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function DeleteScheduleItemButton({ itemId }: { itemId: number }) {
    const { toast } = useToast();
    const handleDelete = async () => {
        const result = await deleteScheduleItem(itemId);
        if (result?.error) {
            toast({ variant: 'destructive', title: 'Ошибка', description: result.error });
        } else {
            toast({ title: 'Урок удален из расписания' });
        }
    }

    return (
         <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Это действие удалит урок из расписания.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Удалить
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

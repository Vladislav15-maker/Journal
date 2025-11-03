

'use client';

import React, { useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash2, CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addAcademicYear, setFinalGrade, deleteAcademicYear, addQuarter, deleteQuarter } from '@/lib/actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FinalGrade, Quarter } from '@/lib/definitions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ru } from 'date-fns/locale';


function SubmitButton({ children, ...props }: { children: React.ReactNode, props?: any }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? 'Сохранение...' : children}
    </Button>
  );
}

export function AddYearButton() {
  const [isOpen, setIsOpen] = React.useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  const handleAction = async (formData: FormData) => {
    const result = await addAcademicYear(formData);
    if (result?.error) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: result.error,
      });
    } else {
      toast({
        title: 'Учебный год создан',
        description: `Год был успешно добавлен.`,
      });
      setIsOpen(false);
      formRef.current?.reset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <PlusCircle className="mr-2 h-4 w-4" /> Создать год
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Создать новый учебный год</DialogTitle>
          <DialogDescription>
            Введите название в формате ГГГГ-ГГГГ. Например: 2023-2024.
          </DialogDescription>
        </DialogHeader>
        <form action={handleAction} ref={formRef} className="space-y-4">
          <div>
            <Label htmlFor="year-name" className="sr-only">Название года</Label>
            <Input
              id="year-name"
              name="name"
              placeholder="Например: 2024-2025"
              required
              pattern="\d{4}-\d{4}"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">Отмена</Button>
            </DialogClose>
            <SubmitButton>Создать</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddQuarterDialog({ academicYearId }: { academicYearId: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const { toast } = useToast();

  const handleAction = async (formData: FormData) => {
    if (!startDate || !endDate) {
        toast({ variant: 'destructive', title: 'Ошибка', description: "Выберите даты начала и конца четверти."});
        return;
    }
    formData.set('academicYearId', String(academicYearId));
    formData.set('startDate', startDate.toISOString());
    formData.set('endDate', endDate.toISOString());

    const result = await addQuarter(formData);
    if (result?.error) {
      toast({ variant: 'destructive', title: 'Ошибка', description: result.error });
    } else {
      toast({ title: 'Четверть создана' });
      setIsOpen(false);
      formRef.current?.reset();
      setStartDate(undefined);
      setEndDate(undefined);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" className="w-full mt-2">
          <PlusCircle className="mr-2 h-4 w-4" /> Создать четверть
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Создать новую четверть</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={handleAction} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Название</Label>
                <Select name="name" required>
                    <SelectTrigger id="name">
                        <SelectValue placeholder="Выберите название" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1-я четверть">1-я четверть</SelectItem>
                        <SelectItem value="2-я четверть">2-я четверть</SelectItem>
                        <SelectItem value="3-я четверть">3-я четверть</SelectItem>
                        <SelectItem value="4-я четверть">4-я четверть</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <Label>Дата начала</Label>
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button
                        variant={"outline"}
                        className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                        >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP", { locale: ru }) : <span>Выберите дату</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus locale={ru}/>
                    </PopoverContent>
                </Popover>
            </div>
            <div className="space-y-2">
                <Label>Дата окончания</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                        variant={"outline"}
                        className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                        >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP", { locale: ru }) : <span>Выберите дату</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus locale={ru}/>
                    </PopoverContent>
                </Popover>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button type="button" variant="ghost">Отмена</Button></DialogClose>
                <SubmitButton>Создать</SubmitButton>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function DeleteYearButton({ yearId, yearName }: { yearId: number, yearName: string }) {
    const { toast } = useToast();
    const handleDelete = async () => {
        const result = await deleteAcademicYear(yearId);
        if (result?.error) {
            toast({ variant: 'destructive', title: 'Ошибка', description: result.error });
        } else {
            toast({ title: 'Учебный год удален' });
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Это действие навсегда удалит учебный год "{yearName}" и все связанные с ним данные (четверти, итоговые оценки).
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
    );
}

export function DeleteQuarterButton({ quarterId, quarterName }: { quarterId: number, quarterName: string }) {
    const { toast } = useToast();
    const handleDelete = async () => {
        const result = await deleteQuarter(quarterId);
        if (result?.error) {
            toast({ variant: 'destructive', title: 'Ошибка', description: result.error });
        } else {
            toast({ title: 'Четверть удалена' });
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-5 w-5">
                    <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Это действие навсегда удалит четверть "{quarterName}" и все связанные с ней итоговые оценки.
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
    );
}


export function GradeSelector({
  studentId,
  subjectId,
  academicPeriodId,
  periodType,
  existingGradeValue
}: {
  studentId: number,
  subjectId: number,
  academicPeriodId: number,
  periodType: 'quarter' | 'year' | 'exam',
  existingGradeValue?: number | null
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  const handleAction = async (formData: FormData) => {
    const grade = formData.get('grade');
    if (grade === null || grade === '' || isNaN(Number(grade))) {
        // This case is for clearing a grade, which we don't support right now, so just return
        return;
    }
    
    formData.set('studentId', String(studentId));
    formData.set('subjectId', String(subjectId));
    formData.set('academicPeriodId', String(academicPeriodId));
    formData.set('periodType', periodType);

    const result = await setFinalGrade(formData);

    if (result?.error) {
        toast({ variant: 'destructive', title: 'Ошибка', description: result.error });
    } else {
        toast({ title: 'Оценка сохранена' });
    }
  };
  
  // The form is now submitted when the value of the Select changes.
  return (
     <form action={handleAction} ref={formRef} onChange={(e) => formRef.current?.requestSubmit()}>
      <Select name="grade" defaultValue={String(existingGradeValue ?? '')}>
        <SelectTrigger className="w-[100px] h-9">
          <SelectValue placeholder="---" />
        </SelectTrigger>
        <SelectContent>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="4">4</SelectItem>
            <SelectItem value="3">3</SelectItem>
            <SelectItem value="2">2</SelectItem>
        </SelectContent>
      </Select>
     </form>
  );
}

    

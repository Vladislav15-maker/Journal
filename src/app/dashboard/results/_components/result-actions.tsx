
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
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addAcademicYear, setFinalGrade } from '@/lib/actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FinalGrade, Quarter } from '@/lib/definitions';

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
        <Button variant="outline">
          <PlusCircle className="mr-2 h-4 w-4" /> Создать учебный год
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

export function SetGradeCell({
    studentId,
    subjectId,
    quarter,
    existingGrade
}: {
    studentId: number,
    subjectId: number,
    quarter: Quarter,
    existingGrade?: FinalGrade
}) {
    const [grade, setGrade] = useState(existingGrade?.grade ?? '');
    const { toast } = useToast();

    const handleSetGrade = async () => {
        if (!grade || isNaN(Number(grade))) {
            toast({
                variant: 'destructive',
                title: 'Ошибка',
                description: 'Введите корректную оценку (число).',
            });
            return;
        }

        const result = await setFinalGrade(studentId, subjectId, quarter.id, Number(grade));

        if (result?.error) {
             toast({ variant: 'destructive', title: 'Ошибка', description: result.error });
        } else {
            toast({ title: 'Оценка сохранена' });
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Input
                type="number"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="h-8 w-20"
                placeholder="Оценка"
            />
            <Button size="sm" onClick={handleSetGrade} disabled={grade === (existingGrade?.grade ?? '')}>
                {existingGrade ? 'Обновить' : 'Сохранить'}
            </Button>
        </div>
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
  const [currentGrade, setCurrentGrade] = useState(existingGradeValue ?? '');
  const { toast } = useToast();

  const handleAction = async (formData: FormData) => {
    const grade = formData.get('grade');
    if (grade === null || grade === '' || isNaN(Number(grade))) {
        toast({ variant: 'destructive', title: 'Ошибка', description: 'Выберите оценку.' });
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
        setCurrentGrade(Number(grade));
    }
  };

  return (
     <form action={handleAction} ref={formRef} onChange={(e) => (e.currentTarget as HTMLFormElement).requestSubmit()}>
      <Select name="grade" value={String(currentGrade)}>
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

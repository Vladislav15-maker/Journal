'use client';

import React, { useRef } from 'react';
import { useFormStatus } from 'react-dom';
import {
  addClass,
  addStudent,
  addSubject,
  deleteClass,
  deleteStudent,
  deleteSubject,
} from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { BookMinus, BookPlus, PlusCircle, Trash2, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

function SubmitButton({ children, variant, ...props }: { children: React.ReactNode, variant?: any, props?: any }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} variant={variant} {...props}>
      {pending ? 'Сохранение...' : children}
    </Button>
  );
}

export function AddClassButton() {
  const [isOpen, setIsOpen] = React.useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  const handleAddClass = async (formData: FormData) => {
    const name = formData.get('name') as string;
    const result = await addClass(name);
    if (result?.error) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: result.error,
      });
    } else {
      toast({
        title: 'Класс создан',
        description: `Класс "${name}" был успешно добавлен.`,
      });
      setIsOpen(false);
      formRef.current?.reset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <PlusCircle /> Создать класс
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Создать новый класс</DialogTitle>
          <DialogDescription>
            Введите название нового класса. Например: 10А.
          </DialogDescription>
        </DialogHeader>
        <form action={handleAddClass} ref={formRef} className="space-y-4">
          <div>
            <Label htmlFor="new-class-name" className="sr-only">Название класса</Label>
            <Input
              id="new-class-name"
              name="name"
              placeholder="Например: 8В"
              required
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

export function AddStudentForm({ classId }: { classId: number }) {
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  const handleAddStudent = async (formData: FormData) => {
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const result = await addStudent(firstName, lastName, classId);

    if (result?.error) {
      toast({ variant: 'destructive', title: 'Ошибка', description: result.error });
    } else {
      toast({ title: 'Ученик добавлен' });
      formRef.current?.reset();
    }
  };

  return (
    <form action={handleAddStudent} ref={formRef} className="flex gap-2">
      <Input placeholder="Имя" name="firstName" required className="max-w-xs" />
      <Input placeholder="Фамилия" name="lastName" required className="max-w-xs" />
      <SubmitButton><UserPlus/> Добавить</SubmitButton>
    </form>
  );
}

export function AddSubjectForm({ classId }: { classId: number }) {
    const formRef = useRef<HTMLFormElement>(null);
    const { toast } = useToast();

    const handleAddSubject = async (formData: FormData) => {
        const name = formData.get('name') as string;
        const result = await addSubject(name, classId);

        if (result?.error) {
            toast({ variant: 'destructive', title: 'Ошибка', description: result.error });
        } else {
            toast({ title: 'Предмет добавлен' });
            formRef.current?.reset();
        }
    };

    return (
        <form action={handleAddSubject} ref={formRef} className="flex gap-2">
            <Input placeholder="Название предмета" name="name" required className="max-w-xs" />
            <SubmitButton><BookPlus/> Добавить</SubmitButton>
        </form>
    );
}

export function DeleteClassButton({ classId, className }: { classId: number, className?: string }) {
    const { toast } = useToast();
    const handleDelete = async () => {
        const result = await deleteClass(classId);
        if (result?.error) {
            toast({ variant: 'destructive', title: 'Ошибка', description: result.error });
        } else {
            toast({ title: 'Класс удален' });
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className={className}>
                    <Trash2 /> Удалить класс
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Это действие навсегда удалит класс и все связанные с ним данные (учеников, предметы, оценки и т.д.).
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

export function DeleteStudentButton({ studentId, studentName }: { studentId: number, studentName: string }) {
    const { toast } = useToast();
    const handleDelete = async () => {
        const result = await deleteStudent(studentId);
        if (result?.error) {
            toast({ variant: 'destructive', title: 'Ошибка', description: result.error });
        } else {
            toast({ title: 'Ученик удален' });
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Это действие навсегда удалит ученика {studentName} и все его оценки.
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

export function DeleteSubjectButton({ subjectId, subjectName }: { subjectId: number, subjectName: string }) {
    const { toast } = useToast();
    const handleDelete = async () => {
        const result = await deleteSubject(subjectId);
        if (result?.error) {
            toast({ variant: 'destructive', title: 'Ошибка', description: result.error });
        } else {
            toast({ title: 'Предмет удален' });
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                 <Button variant="ghost" size="icon">
                    <BookMinus className="h-4 w-4 text-destructive" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Это действие навсегда удалит предмет "{subjectName}" и все связанные с ним данные (уроки, расписание, оценки).
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

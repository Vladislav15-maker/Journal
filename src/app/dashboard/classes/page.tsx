
"use client";
import React, { useState, useMemo } from 'react';
import { initialData } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Users, UserPlus, Trash2, PlusCircle, BookPlus, BookMinus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppData, Student, Class, Subject } from '@/lib/definitions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export default function ClassesPage() {
    const [data, setData] = useState<AppData>(initialData);
    const [newStudentFirstName, setNewStudentFirstName] = useState('');
    const [newStudentLastName, setNewStudentLastName] = useState('');
    const [selectedClassId, setSelectedClassId] = useState(data.classes[0]?.id || '');
    const [newClassName, setNewClassName] = useState('');
    const [newSubjectName, setNewSubjectName] = useState('');
    const [isAddClassDialogOpen, setIsAddClassDialogOpen] = useState(false);
    const [isAddSubjectDialogOpen, setIsAddSubjectDialogOpen] = useState(false);

    const currentClass = useMemo(() => data.classes.find(c => c.id === selectedClassId), [data.classes, selectedClassId]);

    const handleAddStudent = () => {
        if (!newStudentFirstName.trim() || !newStudentLastName.trim() || !selectedClassId) return;

        const newStudent: Student = {
            id: `s-${new Date().getTime()}`,
            firstName: newStudentFirstName,
            lastName: newStudentLastName,
        };

        setData(prevData => {
            const updatedClasses = prevData.classes.map(c => {
                if (c.id === selectedClassId) {
                    // Create a new students array with the new student
                    const updatedStudents = [...c.students, newStudent];
                    return { ...c, students: updatedStudents };
                }
                return c;
            });
            return { ...prevData, classes: updatedClasses };
        });

        setNewStudentFirstName('');
        setNewStudentLastName('');
    };

    const handleDeleteStudent = (studentId: string) => {
        if (!selectedClassId) return;
        setData(prevData => {
            const updatedClasses = prevData.classes.map(c => {
                if (c.id === selectedClassId) {
                    return { ...c, students: c.students.filter(s => s.id !== studentId) };
                }
                return c;
            });
            // Also remove grades associated with the student
            const updatedGrades = prevData.grades.filter(g => g.studentId !== studentId);
            return { ...prevData, classes: updatedClasses, grades: updatedGrades };
        });
    }

    const handleAddClass = () => {
        if (!newClassName.trim()) return;

        const newClass: Class = {
            id: `c-${new Date().getTime()}`,
            name: newClassName,
            students: [],
            subjects: []
        };

        setData(prevData => {
            const newClasses = [...prevData.classes, newClass];
            return { ...prevData, classes: newClasses };
        });

        setSelectedClassId(newClass.id);
        setNewClassName('');
        setIsAddClassDialogOpen(false);
    };

    const handleDeleteClass = (classId: string) => {
        setData(prevData => {
            const updatedClasses = prevData.classes.filter(c => c.id !== classId);
            const remainingClassId = updatedClasses.length > 0 ? updatedClasses[0].id : '';
            if (selectedClassId === classId) {
                setSelectedClassId(remainingClassId);
            }
            // You might want to also delete students, subjects, lessons, grades associated with this class
            return { ...prevData, classes: updatedClasses };
        });
    };
    
    const handleAddSubject = () => {
        if (!newSubjectName.trim() || !selectedClassId) return;

        const newSubject: Subject = {
            id: `sub-${selectedClassId}-${new Date().getTime()}`,
            name: newSubjectName,
        };

        setData(prevData => {
            const updatedClasses = prevData.classes.map(c => {
                if (c.id === selectedClassId) {
                    return { ...c, subjects: [...c.subjects, newSubject] };
                }
                return c;
            });
            return { ...prevData, classes: updatedClasses };
        });

        setNewSubjectName('');
        setIsAddSubjectDialogOpen(false);
    };
    
    const handleDeleteSubject = (subjectId: string) => {
        if (!selectedClassId) return;

        setData(prevData => {
            const updatedClasses = prevData.classes.map(c => {
                if (c.id === selectedClassId) {
                    return { ...c, subjects: c.subjects.filter(sub => sub.id !== subjectId) };
                }
                return c;
            });
            // Also remove related lessons, schedule items, and grades
            const updatedSchedule = prevData.schedule.filter(item => !(item.classId === selectedClassId && item.subjectId === subjectId));
            const updatedLessons = prevData.lessons.filter(item => !(item.subjectId === subjectId && classScheduleHasLesson(item.id, prevData.schedule, selectedClassId)));
            const lessonIdsToDelete = prevData.lessons.filter(l => l.subjectId === subjectId).map(l => l.id);
            const updatedGrades = prevData.grades.filter(g => !lessonIdsToDelete.includes(g.lessonId));

            return {
                ...prevData,
                classes: updatedClasses,
                schedule: updatedSchedule,
                lessons: updatedLessons,
                grades: updatedGrades
            };
        });
    };

    // Helper function to check if a lesson is part of a class's schedule
    const classScheduleHasLesson = (lessonId: string, schedule: any[], classId: string) => {
        // This is a simplified check. You might need a more robust way
        // to link lessons to a class schedule if the IDs aren't directly related.
        return schedule.some(item => item.classId === classId && lessonId.includes(item.subjectId));
    };


    return (
        <div className="flex flex-col md:flex-row gap-6">
            <Card className="w-full md:w-1/4">
                <CardHeader>
                    <CardTitle>Классы</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                    {data.classes.map(c => (
                        <Button
                            key={c.id}
                            variant={selectedClassId === c.id ? 'secondary' : 'ghost'}
                            onClick={() => setSelectedClassId(c.id)}
                            className="justify-start"
                        >
                            {c.name}
                        </Button>
                    ))}
                </CardContent>
                <CardFooter>
                    <Dialog open={isAddClassDialogOpen} onOpenChange={setIsAddClassDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="w-full">
                                <PlusCircle className="mr-2 h-4 w-4" /> Создать класс
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Создать новый класс</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="new-class-name" className="text-right">Название</Label>
                                    <Input
                                        id="new-class-name"
                                        value={newClassName}
                                        onChange={(e) => setNewClassName(e.target.value)}
                                        className="col-span-3"
                                        placeholder="Например: 8В"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleAddClass}>Создать</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardFooter>
            </Card>
            <Card className="w-full md:w-3/4">
                {currentClass ? (
                    <>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Users /> {currentClass.name}
                                </div>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm" disabled={data.classes.length <= 1}>
                                            <Trash2 className="mr-2 h-4 w-4" /> Удалить класс
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Это действие навсегда удалит класс "{currentClass.name}" и все связанные с ним данные (учеников, оценки и т.д.).
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteClass(currentClass.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                Удалить
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardTitle>
                            <CardDescription>
                                Здесь вы можете управлять списком учеников и предметов в классе.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-lg font-medium mb-4">Список учеников</h3>
                                     <div className="flex gap-2 mb-4">
                                        <Input
                                            placeholder="Имя"
                                            value={newStudentFirstName}
                                            onChange={(e) => setNewStudentFirstName(e.target.value)}
                                            className="max-w-xs"
                                        />
                                        <Input
                                            placeholder="Фамилия"
                                            value={newStudentLastName}
                                            onChange={(e) => setNewStudentLastName(e.target.value)}
                                             className="max-w-xs"
                                        />
                                        <Button onClick={handleAddStudent}><UserPlus className="mr-2 h-4 w-4" /> Добавить</Button>
                                    </div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>№</TableHead>
                                                <TableHead>Фамилия</TableHead>
                                                <TableHead>Имя</TableHead>
                                                <TableHead className="text-right">Действия</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {currentClass.students.map((student, index) => (
                                                <TableRow key={student.id}>
                                                    <TableCell>{index + 1}</TableCell>
                                                    <TableCell className="font-medium">{student.lastName}</TableCell>
                                                    <TableCell>{student.firstName}</TableCell>
                                                    <TableCell className="text-right">
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
                                                                        Это действие навсегда удалит ученика {student.lastName} {student.firstName} и все его оценки.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleDeleteStudent(student.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                                        Удалить
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium mb-4">Список предметов</h3>
                                     <div className="flex gap-2 mb-4">
                                        <Input
                                            placeholder="Название предмета"
                                            value={newSubjectName}
                                            onChange={(e) => setNewSubjectName(e.target.value)}
                                            className="max-w-xs"
                                        />
                                        <Button onClick={() => handleAddSubject()}><BookPlus className="mr-2 h-4 w-4" /> Добавить</Button>
                                    </div>
                                    <Table>
                                         <TableHeader>
                                            <TableRow>
                                                <TableHead>Предмет</TableHead>
                                                <TableHead className="text-right">Действия</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {currentClass.subjects.map(subject => (
                                                <TableRow key={subject.id}>
                                                    <TableCell className="font-medium">{subject.name}</TableCell>
                                                    <TableCell className="text-right">
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
                                                                        Это действие навсегда удалит предмет "{subject.name}" и все связанные с ним данные (уроки, расписание, оценки).
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleDeleteSubject(subject.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                                        Удалить
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </CardContent>
                    </>
                ) : (
                    <CardContent className="flex items-center justify-center h-full">
                        <div className="text-center text-muted-foreground">
                            <p>Выберите класс для просмотра или создайте новый.</p>
                        </div>
                    </CardContent>
                )}
            </Card>
        </div>
    );
}

    
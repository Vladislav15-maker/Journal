
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { BarChart, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { attendanceStatusTranslations } from '@/lib/definitions';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { classes, students as studentsTable, grades, lessons, subjects } from '@/lib/schema';
import { AttendanceController } from './_components/attendance-controller';


type AttendanceStat = {
    id: number;
    firstName: string;
    lastName: string;
    present: number;
    absent: number;
    excused: number;
    total: number;
    presentPercentage: string;
}

export default async function AttendancePage({ searchParams }: { searchParams: { classId?: string }}) {
    const allClasses = await db.query.classes.findMany();

    if (allClasses.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BarChart /> Посещаемость</CardTitle>
                    <CardDescription>Нет доступных классов для просмотра статистики.</CardDescription>
                </CardHeader>
                 <CardContent>
                    <p className="text-muted-foreground">Пожалуйста, сначала создайте класс на странице "Мои классы".</p>
                </CardContent>
            </Card>
        );
    }

    const selectedClassId = searchParams.classId ? parseInt(searchParams.classId) : allClasses[0].id;
    
    let attendanceStats: AttendanceStat[] = [];
    
    if (selectedClassId) {
        const selectedClass = await db.query.classes.findFirst({
            where: eq(classes.id, selectedClassId),
            with: { students: true, subjects: true }
        });

        if (selectedClass && selectedClass.students.length > 0) {
            const classSubjectIds = selectedClass.subjects.map(s => s.id);
            
            const classLessons = classSubjectIds.length > 0 ? await db.query.lessons.findMany({
                where: (lessons, { inArray }) => inArray(lessons.subjectId, classSubjectIds)
            }) : [];

            const classLessonIds = classLessons.map(l => l.id);
            const classStudentIds = selectedClass.students.map(s => s.id);

            const allGrades = (classLessonIds.length > 0 && classStudentIds.length > 0) ? await db.query.grades.findMany({
                where: (grades, { and, inArray }) => and(
                    inArray(grades.lessonId, classLessonIds),
                    inArray(grades.studentId, classStudentIds)
                )
            }) : [];

            attendanceStats = selectedClass.students.map(student => {
                const studentGrades = allGrades.filter(g => g.studentId === student.id);
                const present = studentGrades.filter(g => g.attendance === 'present').length;
                const absent = studentGrades.filter(g => g.attendance === 'absent').length;
                const excused = studentGrades.filter(g => g.attendance === 'excused').length;
                const total = present + absent + excused;
                const presentPercentage = total > 0 ? ((present / total) * 100).toFixed(0) : "0";

                return {
                    id: student.id,
                    firstName: student.firstName,
                    lastName: student.lastName,
                    present,
                    absent,
                    excused,
                    total,
                    presentPercentage
                };
            });
        }
    }


    return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart /> Посещаемость
                    </CardTitle>
                    <CardDescription>
                        Выберите класс для просмотра статистики посещаемости.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 mb-6">
                        <AttendanceController allClasses={allClasses} selectedClassId={selectedClassId} />
                    </div>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Ученик</TableHead>
                                <TableHead className="text-center">{attendanceStatusTranslations.present}</TableHead>
                                <TableHead className="text-center">{attendanceStatusTranslations.absent}</TableHead>
                                <TableHead className="text-center">{attendanceStatusTranslations.excused}</TableHead>
                                <TableHead className="text-center">Всего уроков</TableHead>
                                <TableHead className="text-center">% Посещений</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {attendanceStats.map(stat => (
                                <TableRow key={stat.id}>
                                    <TableCell className="font-medium">{stat.lastName} {stat.firstName}</TableCell>
                                    <TableCell className="text-center">{stat.present}</TableCell>
                                    <TableCell className="text-center">{stat.absent}</TableCell>
                                    <TableCell className="text-center">{stat.excused}</TableCell>
                                    <TableCell className="text-center">{stat.total}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={Number(stat.presentPercentage) >= 80 ? "default" : "destructive"}>
                                            {stat.presentPercentage}%
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}


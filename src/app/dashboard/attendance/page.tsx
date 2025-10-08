
"use client";
import React, { useState, useMemo } from 'react';
import { initialData } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { BarChart, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { attendanceStatusTranslations } from '@/lib/definitions';
import { AppData, Class } from '@/lib/definitions';

export default function AttendancePage() {
    const [data, setData] = useState<AppData>(initialData);
    const [selectedClassId, setSelectedClassId] = useState<string>(data.classes[0].id);

    const selectedClass = useMemo(() => data.classes.find(c => c.id === selectedClassId)!, [data.classes, selectedClassId]);

    const attendanceStats = useMemo(() => {
        if (!selectedClass) return [];
        
        const classSubjects = selectedClass.subjects.map(s => s.id);
        const classLessons = data.lessons.filter(l => classSubjects.includes(l.subjectId));

        return selectedClass.students.map(student => {
            const studentGrades = data.grades.filter(g => g.studentId === student.id && classLessons.some(l => l.id === g.lessonId));
            const present = studentGrades.filter(g => g.attendance === 'present').length;
            const absent = studentGrades.filter(g => g.attendance === 'absent').length;
            const excused = studentGrades.filter(g => g.attendance === 'excused').length;
            const total = present + absent + excused;
            const presentPercentage = total > 0 ? ((present / total) * 100).toFixed(0) : 0;

            return {
                ...student,
                present,
                absent,
                excused,
                total,
                presentPercentage
            };
        });
    }, [selectedClass, data.grades, data.lessons]);


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
                         <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-muted-foreground" />
                            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Выберите класс" />
                                </SelectTrigger>
                                <SelectContent>
                                    {data.classes.map((c: Class) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
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

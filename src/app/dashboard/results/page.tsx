
import React from 'react';
import { Award, CalendarDays, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from '@/lib/db';
import { academicYears, classes, finalGrades, grades, lessons, quarters as quartersTable, subjects } from '@/lib/schema';
import { and, eq, gte, lte, inArray, desc } from 'drizzle-orm';
import { ResultsController } from './_components/results-controller';
import { AddYearButton, GradeSelector, DeleteYearButton } from './_components/results-actions';
import { Badge } from '@/components/ui/badge';
import { Student, Quarter } from '@/lib/definitions';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';


type CalculatedResult = {
    student: Student;
    sorSochAverage: number | null;
    formativeAverage: number | null;
    totalPercentage: number;
    finalGrades: {
        q1?: number | null;
        q2?: number | null;
        q3?: number | null;
        q4?: number | null;
        year?: number | null;
        exam?: number | null;
    }
}

function calculateQuarterlyPercentage(grades: (typeof grades.$inferSelect & { lesson: typeof lessons.$inferSelect })[]): number {
    const sorGrades = grades.filter(g => g.lesson.lessonType === 'SOR' && g.grade !== null && g.lesson.maxPoints !== null && g.lesson.maxPoints > 0);
    const sochGrades = grades.filter(g => g.lesson.lessonType === 'SOCH' && g.grade !== null && g.lesson.maxPoints !== null && g.lesson.maxPoints > 0);
    
    // Берём до 10 формативных оценок.
    const formativeGrades = grades.filter(g => 
        (g.lesson.lessonType === 'Default' || g.lesson.lessonType === 'Class Work' || g.lesson.lessonType === 'Independent Work') && g.grade !== null
    ).slice(0, 10);

    const sorTotal = sorGrades.reduce((acc, g) => acc + (g.grade! / g.lesson.maxPoints!) * 100, 0);
    const sorAverage = sorGrades.length > 0 ? sorTotal / sorGrades.length : 0;

    const sochTotal = sochGrades.reduce((acc, g) => acc + (g.grade! / g.lesson.maxPoints!) * 100, 0);
    const sochAverage = sochGrades.length > 0 ? sochTotal / sochGrades.length : 0;

    // Для формативных оценок максимальный балл всегда 10
    const formativeTotal = formativeGrades.reduce((acc, g) => acc + g.grade!, 0);
    const formativeCount = formativeGrades.length;
    const formativeAveragePercentage = formativeCount > 0 ? (formativeTotal / (formativeCount * 10)) * 100 : 0;

    // Веса: ФО - 25%, СОР - 25%, СОЧ - 50%
    const totalPercentage = (formativeAveragePercentage * 0.25) + (sorAverage * 0.25) + (sochAverage * 0.5);

    return Math.round(totalPercentage);
}

export default async function ResultsPage({ searchParams }: { searchParams: { yearId?: string, quarterId?: string, classId?: string, subjectId?: string } }) {

    const allYears = await db.query.academicYears.findMany({
        with: { quarters: { orderBy: (q, {asc}) => [asc(q.name)] } },
        orderBy: (y, {desc}) => [desc(y.name)]
    });

    const allClasses = await db.query.classes.findMany();

    if (allYears.length === 0) {
        return (
            <div className="flex h-full flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted p-8 text-center">
                <h2 className="text-2xl font-bold tracking-tight">У вас еще нет учебных лет</h2>
                <p className="mb-4 text-muted-foreground">Создайте свой первый учебный год, чтобы начать выставлять итоговые оценки.</p>
                <AddYearButton />
            </div>
        );
    }
    
    // --- Параметры ---
    const selectedYearId = searchParams.yearId ? parseInt(searchParams.yearId) : allYears[0].id;
    const selectedYear = allYears.find(y => y.id === selectedYearId);
    
    const selectedQuarterId = searchParams.quarterId ? parseInt(searchParams.quarterId) : selectedYear?.quarters[0]?.id;
    const selectedClassId = searchParams.classId ? parseInt(searchParams.classId) : allClasses[0]?.id;

    const classSubjects = selectedClassId ? await db.query.subjects.findMany({
        where: eq(subjects.classId, selectedClassId)
    }) : [];
    
    const selectedSubjectId = searchParams.subjectId ? parseInt(searchParams.subjectId) : classSubjects[0]?.id;

    let results: CalculatedResult[] = [];
    const selectedQuarter = selectedYear?.quarters.find(q => q.id === selectedQuarterId);

    if (selectedClassId && selectedSubjectId && selectedQuarter && selectedYear) {
        const currentClass = await db.query.classes.findFirst({
            where: eq(classes.id, selectedClassId),
            with: { students: true }
        });
        
        if (currentClass && currentClass.students.length > 0) {
            const studentIds = currentClass.students.map(s => s.id);
            
            const quarterLessons = await db.query.lessons.findMany({
                where: and(
                    eq(lessons.subjectId, selectedSubjectId),
                    gte(lessons.date, new Date(selectedQuarter.startDate)),
                    lte(lessons.date, new Date(selectedQuarter.endDate))
                ),
            });
            const lessonIds = quarterLessons.map(l => l.id);

            const studentGrades = lessonIds.length > 0 ? await db.query.grades.findMany({
                where: and(inArray(grades.studentId, studentIds), inArray(grades.lessonId, lessonIds)),
                with: { lesson: true }
            }) : [];
            
            const allFinalGradesForYear = await db.query.finalGrades.findMany({
                where: and(inArray(finalGrades.studentId, studentIds), eq(finalGrades.subjectId, selectedSubjectId))
            });

            results = currentClass.students.map(student => {
                const gradesForStudent = studentGrades.filter(g => g.studentId === student.id);
                const totalPercentage = calculateQuarterlyPercentage(gradesForStudent);
                
                const finalGradesForStudent = allFinalGradesForYear.filter(fg => fg.studentId === student.id);
                
                const getFinalGrade = (periodType: 'quarter' | 'year' | 'exam', periodId?: number) => {
                    if (!periodId) return null;
                    return finalGradesForStudent.find(fg => fg.periodType === periodType && fg.academicPeriodId === periodId)?.grade;
                }

                return {
                    student,
                    sorSochAverage: 0,
                    formativeAverage: 0,
                    totalPercentage,
                    finalGrades: {
                        q1: getFinalGrade('quarter', selectedYear.quarters.find(q => q.name === '1-я четверть')?.id),
                        q2: getFinalGrade('quarter', selectedYear.quarters.find(q => q.name === '2-я четверть')?.id),
                        q3: getFinalGrade('quarter', selectedYear.quarters.find(q => q.name === '3-я четверть')?.id),
                        q4: getFinalGrade('quarter', selectedYear.quarters.find(q => q.name === '4-я четверть')?.id),
                        year: getFinalGrade('year', selectedYearId),
                    }
                };
            });
        }
    }


    return (
        <div className="flex flex-col md:flex-row gap-6">
            <Card className="w-full md:w-1/4">
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2"><CalendarDays/> Учебные года</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                    {allYears.map(y => (
                        <Link key={y.id} href={`/dashboard/results?yearId=${y.id}`} scroll={false} className="group flex items-center justify-between">
                            <Button
                                variant={selectedYearId === y.id ? 'secondary' : 'ghost'}
                                className="w-full justify-start"
                            >
                                {y.name}
                            </Button>
                             <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <DeleteYearButton yearId={y.id} yearName={y.name} />
                             </div>
                        </Link>
                    ))}
                </CardContent>
                <CardFooter>
                    <AddYearButton />
                </CardFooter>
            </Card>

            <Card className="w-full md:w-3/4">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Award /> Итоги</CardTitle>
                    <CardDescription>Расчет процентов и выставление итоговых оценок для года: {selectedYear?.name}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                         <ResultsController
                            academicYears={allYears}
                            allClasses={allClasses}
                            subjects={classSubjects}
                            selectedYearId={selectedYearId}
                            selectedQuarterId={selectedQuarterId}
                            selectedClassId={selectedClassId}
                            selectedSubjectId={selectedSubjectId}
                        />
                    </div>
                   
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Ученик</TableHead>
                                <TableHead className="text-center">Процент за {selectedQuarter?.name}</TableHead>
                                {selectedYear?.quarters.map(q => (
                                    <TableHead key={q.id} className="text-center">{q.name.replace('-я четверть', ' ч.')}</TableHead>
                                ))}
                                <TableHead className="text-center">Год</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {results.map(res => (
                                <TableRow key={res.student.id}>
                                    <TableCell className="font-medium">{res.student.lastName} {res.student.firstName}</TableCell>
                                    <TableCell className="text-center">
                                        {selectedQuarterId && (
                                            <Badge variant={res.totalPercentage >= 85 ? 'default' : res.totalPercentage >= 40 ? 'secondary' : 'destructive'}>
                                                {res.totalPercentage}%
                                            </Badge>
                                        )}
                                    </TableCell>
                                    {selectedYear?.quarters.map((q, index) => (
                                        <TableCell key={q.id} className="text-center">
                                            <GradeSelector 
                                                studentId={res.student.id}
                                                subjectId={selectedSubjectId!}
                                                academicPeriodId={q.id}
                                                periodType='quarter'
                                                existingGradeValue={res.finalGrades[`q${index + 1}` as keyof typeof res.finalGrades]}
                                            />
                                        </TableCell>
                                    ))}
                                    <TableCell className="text-center">
                                        <GradeSelector 
                                            studentId={res.student.id}
                                            subjectId={selectedSubjectId!}
                                            academicPeriodId={selectedYearId!}
                                            periodType='year'
                                            existingGradeValue={res.finalGrades.year}
                                        />
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


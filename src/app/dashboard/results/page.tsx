

import React from 'react';
import { Award, CalendarDays, Trash2, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from '@/lib/db';
import { academicYears, classes, finalGrades, grades, lessons, quarters as quartersTable, subjects } from '@/lib/schema';
import { and, eq, gte, lte, inArray, desc } from 'drizzle-orm';
import { ResultsController } from './_components/results-controller';
import { AddYearButton, GradeSelector, DeleteYearButton, AddQuarterDialog, DeleteQuarterButton } from './_components/results-actions';
import { Badge } from '@/components/ui/badge';
import { Student, Quarter } from '@/lib/definitions';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

type CalculatedResult = {
    student: Student;
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
    const formativeGrades = grades.filter(g =>
        (g.lesson.lessonType === 'Default' || g.lesson.lessonType === 'Class Work' || g.lesson.lessonType === 'Independent Work' || g.lesson.lessonType === 'Project Work')
        && g.grade !== null && g.grade >= 0
    );

    const sorGrades = grades.filter(g => g.lesson.lessonType === 'SOR' && g.grade !== null && g.grade >= 0 && g.lesson.maxPoints !== null && g.lesson.maxPoints > 0);
    const sochGrades = grades.filter(g => g.lesson.lessonType === 'SOCH' && g.grade !== null && g.grade >= 0 && g.lesson.maxPoints !== null && g.lesson.maxPoints > 0);

    // --- Формативное оценивание (FO) - 10% weight ---
    // Учитывается только если есть 4 или более формативных оценок
    let formativeAveragePercentage = 0;
    if (formativeGrades.length >= 4) {
        // Assuming all formative grades are out of 10 points
        const formativeTotal = formativeGrades.reduce((acc, g) => acc + g.grade!, 0);
        const formativeMaxTotal = formativeGrades.length * 10;
        formativeAveragePercentage = formativeMaxTotal > 0 ? (formativeTotal / formativeMaxTotal) * 100 : 0;
    }

    // --- Суммативное оценивание за раздел (SOR) - 50% weight ---
    let sorAveragePercentage = 0;
    if (sorGrades.length > 0) {
        const sorTotal = sorGrades.reduce((acc, g) => acc + g.grade!, 0);
        const sorMaxTotal = sorGrades.reduce((acc, g) => acc + g.lesson.maxPoints!, 0);
        sorAveragePercentage = sorMaxTotal > 0 ? (sorTotal / sorMaxTotal) * 100 : 0;
    }

    // --- Суммативное оценивание за четверть (SOCH) - 40% weight ---
    let sochAveragePercentage = 0;
    if (sochGrades.length > 0) {
        const sochTotal = sochGrades.reduce((acc, g) => acc + g.grade!, 0);
        const sochMaxTotal = sochGrades.reduce((acc, g) => acc + g.lesson.maxPoints!, 0);
        sochAveragePercentage = sochMaxTotal > 0 ? (sochTotal / sochMaxTotal) * 100 : 0;
    }
    
    // --- Final Calculation ---
    // Weights: FO - 10%, SOR - 50%, SOCH - 40%
    const totalPercentage = (formativeAveragePercentage * 0.10) + (sorAveragePercentage * 0.50) + (sochAveragePercentage * 0.40);

    return Math.round(totalPercentage);
}

const getBadgeVariant = (percentage: number): "excellent" | "good" | "satisfactory" | "destructive" => {
    if (percentage >= 86) return 'excellent';
    if (percentage >= 66) return 'good';
    if (percentage >= 30) return 'satisfactory';
    return 'destructive';
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

    if (selectedClassId && selectedSubjectId && selectedYear) {
        const currentClass = await db.query.classes.findFirst({
            where: eq(classes.id, selectedClassId),
            with: { students: true }
        });
        
        if (currentClass && currentClass.students.length > 0) {
            const studentIds = currentClass.students.map(s => s.id);
            
            let studentGrades: (typeof grades.$inferSelect & { lesson: typeof lessons.$inferSelect })[] = [];
            if (selectedQuarter) {
                const quarterLessons = await db.query.lessons.findMany({
                    where: and(
                        eq(lessons.subjectId, selectedSubjectId),
                        gte(lessons.date, new Date(selectedQuarter.startDate)),
                        lte(lessons.date, new Date(selectedQuarter.endDate))
                    ),
                });
                const lessonIds = quarterLessons.map(l => l.id);

                if (lessonIds.length > 0 && studentIds.length > 0) {
                    studentGrades = await db.query.grades.findMany({
                        where: and(inArray(grades.studentId, studentIds), inArray(grades.lessonId, lessonIds)),
                        with: { lesson: true }
                    });
                }
            }
            
            const allFinalGradesForYear = await db.query.finalGrades.findMany({
                where: and(inArray(finalGrades.studentId, studentIds), eq(finalGrades.subjectId, selectedSubjectId))
            });

            results = currentClass.students.map(student => {
                const gradesForStudent = studentGrades.filter(g => g.studentId === student.id);
                const totalPercentage = selectedQuarter ? calculateQuarterlyPercentage(gradesForStudent) : 0;
                
                const finalGradesForStudent = allFinalGradesForYear.filter(fg => fg.studentId === student.id);
                
                const getFinalGrade = (periodType: 'quarter' | 'year' | 'exam', periodId?: number) => {
                    if (!periodId) return null;
                    return finalGradesForStudent.find(fg => fg.periodType === periodType && fg.academicPeriodId === periodId)?.grade;
                }
                
                const quarterNameMapping: {[key: string]: 'q1' | 'q2' | 'q3' | 'q4'} = {
                    "1-я четверть": 'q1',
                    "2-я четверть": 'q2',
                    "3-я четверть": 'q3',
                    "4-я четверть": 'q4',
                };


                const finalGradesObj: CalculatedResult['finalGrades'] = { year: getFinalGrade('year', selectedYearId) };
                selectedYear.quarters.forEach(q => {
                    const qKey = quarterNameMapping[q.name];
                    if(qKey) {
                        finalGradesObj[qKey] = getFinalGrade('quarter', q.id)
                    }
                })

                return {
                    student,
                    totalPercentage,
                    finalGrades: finalGradesObj
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
                       <div key={y.id}>
                         <div className="group flex items-center justify-between">
                            <Button
                                variant={selectedYearId === y.id ? 'secondary' : 'ghost'}
                                className="w-full justify-start flex-1"
                                asChild
                            >
                                <Link href={`/dashboard/results?yearId=${y.id}`} scroll={false}>
                                 {y.name}
                                </Link>
                            </Button>
                             <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <DeleteYearButton yearId={y.id} yearName={y.name} />
                             </div>
                        </div>
                        {selectedYearId === y.id && (
                            <div className="pl-4 mt-2 space-y-2">
                                <p className="text-xs font-semibold text-muted-foreground">Четверти:</p>
                                {y.quarters.length > 0 ? y.quarters.map(q => (
                                    <div key={q.id} className="group flex items-center justify-between text-sm">
                                        <div>
                                            <p>{q.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {format(q.startDate, "dd.MM", { locale: ru })} - {format(q.endDate, "dd.MM", { locale: ru })}
                                            </p>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <DeleteQuarterButton quarterId={q.id} quarterName={q.name} />
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-xs text-muted-foreground">Нет четвертей</p>
                                )}
                                <AddQuarterDialog academicYearId={y.id} />
                            </div>
                        )}
                       </div>
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
                   
                    <div className="mb-4 p-4 border rounded-lg bg-muted/50">
                        <h4 className="flex items-center text-sm font-semibold mb-2"><Info className="h-4 w-4 mr-2"/> Легенда</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-xs">
                           <div className="flex items-center gap-2">
                                <div className="h-4 w-4 rounded-full bg-excellent"></div>
                                <span><b>86-100%</b> - 5 (отлично)</span>
                           </div>
                           <div className="flex items-center gap-2">
                                <div className="h-4 w-4 rounded-full bg-good"></div>
                                <span><b>66-85%</b> - 4 (хорошо)</span>
                           </div>
                           <div className="flex items-center gap-2">
                                <div className="h-4 w-4 rounded-full bg-satisfactory"></div>
                                <span><b>30-65%</b> - 3 (удовл.)</span>
                           </div>
                           <div className="flex items-center gap-2">
                                <div className="h-4 w-4 rounded-full bg-destructive"></div>
                                <span><b>0-29%</b> - 2 (неуд.)</span>
                           </div>
                        </div>
                    </div>
                    
                    <div className="border rounded-md overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="sticky left-0 bg-background z-10">Ученик</TableHead>
                                    <TableHead className="text-center">Процент за {selectedQuarter?.name || 'четверть'}</TableHead>
                                    {selectedYear?.quarters.map(q => (
                                        <TableHead key={q.id} className="text-center">{q.name.replace('-я четверть', ' ч.')}</TableHead>
                                    ))}
                                    <TableHead className="text-center">Год</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {results.map(res => (
                                    <TableRow key={res.student.id}>
                                        <TableCell className="font-medium sticky left-0 bg-background z-10">{res.student.lastName} {res.student.firstName}</TableCell>
                                        <TableCell className="text-center">
                                            {selectedQuarterId ? (
                                                <Badge variant={getBadgeVariant(res.totalPercentage)}>
                                                    {res.totalPercentage}%
                                                </Badge>
                                            ) : '---'}
                                        </TableCell>
                                        {selectedYear?.quarters.map((q) => {
                                            const quarterNameMapping: {[key: string]: 'q1' | 'q2' | 'q3' | 'q4'} = {
                                                "1-я четверть": 'q1', "2-я четверть": 'q2', "3-я четверть": 'q3', "4-я четверть": 'q4',
                                            };
                                            const quarterKey = quarterNameMapping[q.name];
                                            return (
                                                <TableCell key={q.id} className="text-center">
                                                    {selectedSubjectId ? (
                                                        <GradeSelector 
                                                            studentId={res.student.id}
                                                            subjectId={selectedSubjectId}
                                                            academicPeriodId={q.id}
                                                            periodType='quarter'
                                                            existingGradeValue={quarterKey ? res.finalGrades[quarterKey] : null}
                                                        />
                                                    ) : '---'}
                                                </TableCell>
                                            )
                                        })}
                                        <TableCell className="text-center">
                                            {selectedSubjectId ? (
                                                <GradeSelector 
                                                    studentId={res.student.id}
                                                    subjectId={selectedSubjectId}
                                                    academicPeriodId={selectedYearId!}
                                                    periodType='year'
                                                    existingGradeValue={res.finalGrades.year}
                                                />
                                            ) : '---'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

    

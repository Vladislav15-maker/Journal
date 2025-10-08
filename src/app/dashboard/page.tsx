
import { GradebookTable } from '@/components/gradebook/gradebook-table';
import { db } from '@/lib/db';
import { classes, subjects as subjectsTable, lessons as lessonsTable, grades as gradesTable } from '@/lib/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { GradebookController } from './_components/gradebook-controller';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default async function GradebookPage({ searchParams }: { searchParams: { classId?: string; subjectId?: string }}) {
    
    const allClasses = await db.query.classes.findMany({
        with: {
            subjects: true,
            students: true, // Eagerly load students for all classes
        }
    });

    if (allClasses.length === 0) {
        return (
             <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <h2 className="text-2xl font-semibold mb-2">Добро пожаловать в GradeBook Pro!</h2>
                <p>Похоже, у вас еще нет ни одного класса. <br/> Пожалуйста, создайте класс на странице "Мои классы", чтобы начать работу.</p>
            </div>
        )
    }

    const selectedClassId = searchParams.classId ? parseInt(searchParams.classId) : allClasses[0].id;
    
    const currentClass = allClasses.find(c => c.id === selectedClassId);

    const selectedSubjectId = searchParams.subjectId 
        ? parseInt(searchParams.subjectId)
        // Ensure that a valid subject is selected if the class changes
        : currentClass?.subjects[0]?.id;

    let currentLessons: (typeof lessonsTable.$inferSelect)[] = [];
    if (selectedSubjectId) {
        currentLessons = await db.query.lessons.findMany({
            where: eq(lessonsTable.subjectId, selectedSubjectId),
            orderBy: (lessons, { asc }) => [asc(lessons.date)],
        });
    }

    const studentIds = currentClass?.students?.map(s => s.id) ?? [];
    const lessonIds = currentLessons.map(l => l.id);

    let currentGrades: (typeof gradesTable.$inferSelect)[] = [];
    if (studentIds.length > 0 && lessonIds.length > 0) {
        currentGrades = await db.query.grades.findMany({
            where: and(
                inArray(gradesTable.studentId, studentIds),
                inArray(gradesTable.lessonId, lessonIds)
            )
        });
    }

    const studentsWithGrades = currentClass?.students ?? [];

    return (
        <div className="flex flex-col h-full">
            <GradebookController 
                allClasses={allClasses} 
                currentClass={currentClass}
                selectedClassId={selectedClassId}
                selectedSubjectId={selectedSubjectId}
            />
            <div className="flex-1 overflow-auto">
                 {!currentClass || currentClass.subjects.length === 0 ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Нет предметов</CardTitle>
                            <CardDescription>В этом классе еще нет предметов.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Пожалуйста, добавьте хотя бы один предмет на странице "Мои классы", чтобы начать вести журнал.</p>
                        </CardContent>
                    </Card>
                ) : !selectedSubjectId ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Предмет не выбран</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Пожалуйста, выберите предмет для просмотра журнала.</p>
                        </CardContent>
                    </Card>
                ) : studentsWithGrades.length === 0 ? (
                     <Card>
                        <CardHeader>
                            <CardTitle>Нет учеников</CardTitle>
                            <CardDescription>В этом классе еще нет учеников.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Пожалуйста, добавьте учеников на странице "Мои классы".</p>
                        </CardContent>
                    </Card>
                ) : (
                    <GradebookTable
                        students={studentsWithGrades}
                        lessons={currentLessons}
                        grades={currentGrades}
                        subjectId={selectedSubjectId}
                    />
                )}
            </div>
        </div>
    );
}

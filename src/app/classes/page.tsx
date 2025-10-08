
import React from 'react';
import { db } from '@/lib/db';
import { classes } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Users } from "lucide-react";
import { Button } from '@/components/ui/button';
import {
  AddClassButton,
  AddStudentForm,
  AddSubjectForm,
  DeleteClassButton,
  DeleteStudentButton,
  DeleteSubjectButton
} from './_components/class-actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from 'next/link';
import { cn } from '@/lib/utils';

type SearchParams = {
  classId?: string;
};

export default async function ClassesPage({ searchParams }: { searchParams: SearchParams }) {
  const allClasses = await db.query.classes.findMany();

  if (allClasses.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted p-8 text-center">
        <h2 className="text-2xl font-bold tracking-tight">У вас еще нет классов</h2>
        <p className="mb-4 text-muted-foreground">Создайте свой первый класс, чтобы добавить учеников и предметы.</p>
        <AddClassButton />
      </div>
    );
  }

  const selectedClassId = searchParams.classId ? parseInt(searchParams.classId) : allClasses[0].id;

  const currentClass = await db.query.classes.findFirst({
    where: eq(classes.id, selectedClassId),
    with: {
      students: true,
      subjects: true,
    },
  });

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <Card className="w-full md:w-1/4">
        <CardHeader>
          <CardTitle>Классы</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {allClasses.map(c => (
            <Link key={c.id} href={`/dashboard/classes?classId=${c.id}`} scroll={false}>
              <Button
                variant={selectedClassId === c.id ? 'secondary' : 'ghost'}
                className="w-full justify-start"
              >
                {c.name}
              </Button>
            </Link>
          ))}
        </CardContent>
        <CardFooter>
          <AddClassButton />
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
                <DeleteClassButton classId={currentClass.id} className={cn(allClasses.length <= 1 && 'hidden')} />
              </CardTitle>
              <CardDescription>
                Здесь вы можете управлять списком учеников и предметов в классе.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-medium mb-4">Список учеников</h3>
                  <AddStudentForm classId={currentClass.id} />
                  <div className="mt-4 rounded-md border">
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
                              <DeleteStudentButton studentId={student.id} studentName={`${student.lastName} ${student.firstName}`} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-4">Список предметов</h3>
                  <AddSubjectForm classId={currentClass.id} />
                  <div className="mt-4 rounded-md border">
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
                              <DeleteSubjectButton subjectId={subject.id} subjectName={subject.name} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
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

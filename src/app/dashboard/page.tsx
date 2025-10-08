
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { AppData, Class, Grade, Lesson, Subject } from '@/lib/definitions';
import { initialData } from '@/lib/data';
import { GradebookTable } from '@/components/gradebook/gradebook-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function GradebookPage() {
    const [data, setData] = useState<AppData>(initialData);
    
    const [selectedClassId, setSelectedClassId] = useState<string>(data.classes.length > 0 ? data.classes[0].id : '');
    
    const selectedClass = useMemo(() => data.classes.find(c => c.id === selectedClassId)!, [data.classes, selectedClassId]);

    const [selectedSubjectId, setSelectedSubjectId] = useState<string>(selectedClass?.subjects.length > 0 ? selectedClass.subjects[0].id : '');
    
    useEffect(() => {
        if (selectedClass) {
            setSelectedSubjectId(selectedClass.subjects.length > 0 ? selectedClass.subjects[0].id : '');
        }
    }, [selectedClass]);


    const handleClassChange = (classId: string) => {
        setSelectedClassId(classId);
    };
    
    const handleUpdateLesson = (updatedLesson: Lesson) => {
        setData(prevData => ({
            ...prevData,
            lessons: prevData.lessons.map(l => l.id === updatedLesson.id ? updatedLesson : l)
        }));
    };

    const handleUpdateGrade = (updatedGrade: Grade) => {
        setData(prevData => ({
            ...prevData,
            grades: prevData.grades.map(g => g.id === updatedGrade.id ? updatedGrade : g)
        }));
    };

    const currentStudents = selectedClass?.students ?? [];
    const currentLessons = data.lessons.filter(l => l.subjectId === selectedSubjectId);
    const currentGrades = data.grades.filter(g => currentLessons.some(l => l.id === g.lessonId) && currentStudents.some(s => s.id === g.studentId));

    if (data.classes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <h2 className="text-2xl font-semibold mb-2">Нет доступных классов</h2>
                <p>Пожалуйста, создайте класс на странице "Мои классы", чтобы начать работу.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Класс:</span>
                    <Select value={selectedClassId} onValueChange={handleClassChange}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Выберите класс" />
                        </SelectTrigger>
                        <SelectContent>
                            {data.classes.map((c: Class) => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Предмет:</span>
                    <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId} disabled={!selectedClass || selectedClass.subjects.length === 0}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Выберите предмет" />
                        </SelectTrigger>
                        <SelectContent>
                            {selectedClass?.subjects.map((s: Subject) => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="flex-1 overflow-auto">
                {currentStudents.length > 0 && currentLessons.length > 0 ? (
                    <GradebookTable
                        students={currentStudents}
                        lessons={currentLessons}
                        grades={currentGrades}
                        onUpdateLesson={handleUpdateLesson}
                        onUpdateGrade={handleUpdateGrade}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                        <p>Для выбранного класса нет учеников или уроков. <br /> Добавьте их на странице "Мои классы" и "Расписание".</p>
                    </div>
                )}
            </div>
        </div>
    );
}


"use client";
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Settings, Download, FileJson, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { initialData } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
    const { toast } = useToast();

    const exportData = (format: 'json' | 'csv') => {
        try {
            let dataStr: string;
            let fileName: string;
            let mimeType: string;

            if (format === 'json') {
                dataStr = JSON.stringify(initialData, null, 2);
                fileName = 'gradebook_export.json';
                mimeType = 'application/json';
            } else {
                // Basic CSV conversion
                const { grades, lessons, classes } = initialData;
                const students = classes.flatMap(c => c.students);
                const subjects = classes.flatMap(c => c.subjects);

                const headers = "Student,Class,Subject,Date,Topic,Grade,Attendance,Comment";
                const rows = grades.map(grade => {
                    const student = students.find(s => s.id === grade.studentId);
                    const lesson = lessons.find(l => l.id === grade.lessonId);
                    const subject = subjects.find(s => s.id === lesson?.subjectId);
                    const studentClass = classes.find(c => c.students.some(s => s.id === student?.id));

                    return [
                        `"${student?.lastName} ${student?.firstName}"`,
                        `"${studentClass?.name}"`,
                        `"${subject?.name}"`,
                        `"${lesson?.date}"`,
                        `"${lesson?.topic}"`,
                        grade.grade ?? '',
                        `"${grade.attendance}"`,
                        `"${grade.comment ?? ''}"`
                    ].join(',');
                });

                dataStr = [headers, ...rows].join('\n');
                fileName = 'gradebook_export.csv';
                mimeType = 'text/csv';
            }

            const blob = new Blob([dataStr], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            toast({
                title: "Экспорт успешен",
                description: `Данные были выгружены в файл ${fileName}.`,
            });
        } catch (error) {
            console.error("Export failed:", error);
            toast({
                variant: "destructive",
                title: "Ошибка экспорта",
                description: "Не удалось выгрузить данные.",
            });
        }
    };


    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Settings /> Настройки
                </CardTitle>
                <CardDescription>
                    Настройки приложения и экспорт данных.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <h3 className="text-lg font-medium mb-4">Экспорт данных</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Вы можете выгрузить все данные журнала в формате JSON или CSV.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button variant="outline" onClick={() => exportData('json')}>
                        <FileJson className="mr-2 h-4 w-4" />
                        Экспорт в JSON
                    </Button>
                    <Button variant="outline" onClick={() => exportData('csv')}>
                        <FileText className="mr-2 h-4 w-4" />
                        Экспорт в CSV
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

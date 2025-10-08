
'use client';

import React, { useEffect } from 'react';
import { Class, Subject } from '@/lib/definitions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type GradebookControllerProps = {
    allClasses: (Class & { subjects: Subject[] })[];
    currentClass?: Class & { subjects: Subject[] };
    selectedClassId?: number;
    selectedSubjectId?: number;
};

export function GradebookController({
    allClasses,
    currentClass,
    selectedClassId,
    selectedSubjectId
}: GradebookControllerProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const handleClassChange = (classId: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('classId', classId);
        params.delete('subjectId'); // Reset subject when class changes
        router.push(`${pathname}?${params.toString()}`);
    };
    
    const handleSubjectChange = (subjectId: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('subjectId', subjectId);
        router.push(`${pathname}?${params.toString()}`);
    };

    // If a class is selected but the subject in the URL is not valid for that class,
    // redirect to the first available subject for that class.
    useEffect(() => {
        if (currentClass && selectedSubjectId) {
            const subjectExistsInClass = currentClass.subjects.some(s => s.id === selectedSubjectId);
            if (!subjectExistsInClass && currentClass.subjects.length > 0) {
                 const params = new URLSearchParams(searchParams);
                 params.set('subjectId', String(currentClass.subjects[0].id));
                 router.replace(`${pathname}?${params.toString()}`);
            }
        }
    }, [currentClass, selectedSubjectId, router, pathname, searchParams]);


    return (
        <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Класс:</span>
                <Select value={String(selectedClassId ?? '')} onValueChange={handleClassChange}>
                    <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Выберите класс" />
                    </SelectTrigger>
                    <SelectContent>
                        {allClasses.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Предмет:</span>
                <Select 
                    value={String(selectedSubjectId ?? '')} 
                    onValueChange={handleSubjectChange} 
                    disabled={!currentClass || currentClass.subjects.length === 0}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Выберите предмет" />
                    </SelectTrigger>
                    <SelectContent>
                        {currentClass?.subjects.map((s) => (
                            <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}

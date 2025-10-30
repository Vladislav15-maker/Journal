
'use client';

import React from 'react';
import { AcademicYear, Class, Subject } from '@/lib/definitions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type ResultsControllerProps = {
    academicYears: (AcademicYear & { quarters: { id: number; name: string }[] })[];
    allClasses: Class[];
    subjects: Subject[];

    selectedYearId?: number;
    selectedQuarterId?: number;
    selectedClassId?: number;
    selectedSubjectId?: number;
};

export function ResultsController({
    academicYears,
    allClasses,
    subjects,
    selectedYearId,
    selectedQuarterId,
    selectedClassId,
    selectedSubjectId,
}: ResultsControllerProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const handleValueChange = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams);
        params.set(key, value);
        
        // Reset dependent selections
        if (key === 'yearId') {
            params.delete('quarterId');
        }
        if (key === 'classId') {
            params.delete('subjectId');
        }

        router.push(`${pathname}?${params.toString()}`);
    };
    
    const selectedYear = academicYears.find(y => y.id === selectedYearId);

    return (
        <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Год:</span>
                <Select value={String(selectedYearId ?? '')} onValueChange={(v) => handleValueChange('yearId', v)}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Учебный год" />
                    </SelectTrigger>
                    <SelectContent>
                        {academicYears.map((y) => (
                            <SelectItem key={y.id} value={String(y.id)}>{y.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
             <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Четверть:</span>
                <Select 
                    value={String(selectedQuarterId ?? '')} 
                    onValueChange={(v) => handleValueChange('quarterId', v)}
                    disabled={!selectedYear}
                >
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Выберите четверть" />
                    </SelectTrigger>
                    <SelectContent>
                        {selectedYear?.quarters.map((q) => (
                            <SelectItem key={q.id} value={String(q.id)}>{q.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
             <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Класс:</span>
                <Select value={String(selectedClassId ?? '')} onValueChange={(v) => handleValueChange('classId', v)}>
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
                    onValueChange={(v) => handleValueChange('subjectId', v)} 
                    disabled={!selectedClassId || subjects.length === 0}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Выберите предмет" />
                    </SelectTrigger>
                    <SelectContent>
                        {subjects.map((s) => (
                            <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}


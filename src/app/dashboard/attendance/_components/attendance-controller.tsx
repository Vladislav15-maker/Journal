
'use client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export function AttendanceController({ allClasses, selectedClassId }: { allClasses: any[], selectedClassId: number }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const handleClassChange = (classId: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('classId', classId);
        router.push(`${pathname}?${params.toString()}`);
    }

    return (
        <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <Select value={String(selectedClassId)} onValueChange={handleClassChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Выберите класс" />
                </SelectTrigger>
                <SelectContent>
                    {allClasses.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}


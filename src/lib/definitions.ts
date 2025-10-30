

import type { classes, students, subjects, lessons, grades, scheduleItems, messages, academicYears, quarters, finalGrades } from './schema';

export type Student = typeof students.$inferSelect;
export type Subject = typeof subjects.$inferSelect;
export type Class = typeof classes.$inferSelect & {
    students: Student[];
    subjects: Subject[];
};
export type Lesson = typeof lessons.$inferSelect;
export type Grade = typeof grades.$inferSelect;
export type ScheduleItem = typeof scheduleItems.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type AcademicYear = typeof academicYears.$inferSelect;
export type Quarter = typeof quarters.$inferSelect;
export type FinalGrade = typeof finalGrades.$inferSelect;


export type LessonType = 'Class Work' | 'Independent Work' | 'Project Work' | 'SOR' | 'SOCH' | 'Default';

export const lessonTypes: LessonType[] = ['Default', 'Class Work', 'Independent Work', 'Project Work', 'SOR', 'SOCH'];

export const lessonTypeTranslations: Record<LessonType, string> = {
    'Default': 'Обычный урок',
    'Class Work': 'Работа в классе',
    'Independent Work': 'Самостоятельная работа',
    'Project Work': 'Проектная работа',
    'SOR': 'СОР (Суммативное оценивание за раздел)',
    'SOCH': 'СОЧ (Суммативное оценивание за четверть)',
};


export type AttendanceStatus = 'present' | 'absent' | 'excused';

export const attendanceStatuses: AttendanceStatus[] = ['present', 'absent', 'excused'];

export const attendanceStatusTranslations: Record<AttendanceStatus, string> = {
    'present': 'Присутствовал',
    'absent': 'Отсутствовал',
    'excused': 'Отсутствовал по ув. причине',
};


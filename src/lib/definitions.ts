
export type Student = {
    id: string;
    firstName: string;
    lastName: string;
};

export type Subject = {
    id: string;
    name: string;
};

export type Class = {
    id: string;
    name: string;
    students: Student[];
    subjects: Subject[];
};

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

export type Lesson = {
    id: string;
    subjectId: string;
    date: string; // YYYY-MM-DD
    topic: string;
    homework: string;
    lessonType: LessonType;
    maxPoints?: number;
};

export type AttendanceStatus = 'present' | 'absent' | 'excused';

export const attendanceStatuses: AttendanceStatus[] = ['present', 'absent', 'excused'];

export const attendanceStatusTranslations: Record<AttendanceStatus, string> = {
    'present': 'Присутствовал',
    'absent': 'Отсутствовал',
    'excused': 'Отсутствовал по ув. причине',
};

export type Grade = {
    id: string;
    studentId: string;
    lessonId: string;
    grade?: number;
    attendance: AttendanceStatus;
    comment?: string;
};

export type SentMessage = {
    id: string;
    recipientId: string;
    recipientName: string;
    recipientType: 'class' | 'student';
    message: string;
    timestamp: string;
};

export type ScheduleItem = {
    id: string;
    classId: string;
    dayOfWeek: string; // e.g., "Понедельник"
    lessonNumber: number;
    subjectId: string;
};

export type AppData = {
    classes: Class[];
    lessons: Lesson[];
    grades: Grade[];
    schedule: ScheduleItem[];
    // messages will be handled in component state
};

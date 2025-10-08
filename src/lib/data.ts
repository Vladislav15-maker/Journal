
import { AppData, Class, Grade, Lesson, Student, Subject, AttendanceStatus, ScheduleItem } from './definitions';

// Function to generate lessons for specific schedule
const generateLessonsForSchedule = (scheduleItems: ScheduleItem[], subjects: Subject[], startDate: Date, endDate: Date): Lesson[] => {
    const lessons: Lesson[] = [];
    let currentDate = new Date(startDate);
    const dayMap = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];

    while (currentDate <= endDate) {
        const dayOfWeekName = dayMap[currentDate.getDay()];
        const todaysSchedule = scheduleItems.filter(item => item.dayOfWeek === dayOfWeekName);

        todaysSchedule.forEach(scheduleItem => {
            lessons.push({
                id: `l-${scheduleItem.subjectId}-${currentDate.toISOString().split('T')[0]}-${scheduleItem.lessonNumber}`,
                subjectId: scheduleItem.subjectId,
                date: currentDate.toISOString().split('T')[0],
                topic: 'Тема не задана',
                homework: 'Домашнее задание не задано',
                lessonType: 'Default',
            });
        });

        currentDate.setDate(currentDate.getDate() + 1);
    }
    return lessons;
};

const initialSchedule: ScheduleItem[] = [
    // 7А
    { id: 'sch-1', classId: 'c-1', dayOfWeek: 'Вторник', lessonNumber: 1, subjectId: 'sub-c-1-1' },
    { id: 'sch-2', classId: 'c-1', dayOfWeek: 'Вторник', lessonNumber: 2, subjectId: 'sub-c-1-2' },
    { id: 'sch-3', classId: 'c-1', dayOfWeek: 'Четверг', lessonNumber: 3, subjectId: 'sub-c-1-1' },
    { id: 'sch-4', classId: 'c-1', dayOfWeek: 'Суббота', lessonNumber: 1, subjectId: 'sub-c-1-1' },
    { id: 'sch-5', classId: 'c-1', dayOfWeek: 'Суббота', lessonNumber: 2, subjectId: 'sub-c-1-2' },
    // 9Б
    { id: 'sch-6', classId: 'c-2', dayOfWeek: 'Понедельник', lessonNumber: 4, subjectId: 'sub-c-2-1' },
    { id: 'sch-7', classId: 'c-2', dayOfWeek: 'Среда', lessonNumber: 2, subjectId: 'sub-c-2-2' },
    { id: 'sch-8', classId: 'c-2', dayOfWeek: 'Пятница', lessonNumber: 5, subjectId: 'sub-c-2-1' },
];

// Initial student data
const students7A: Student[] = [
    { id: 's-1', firstName: 'Иван', lastName: 'Иванов' },
    { id: 's-2', firstName: 'Мария', lastName: 'Петрова' },
    { id: 's-3', firstName: 'Алексей', lastName: 'Сидоров' },
    { id: 's-4', firstName: 'Елена', lastName: 'Кузнецова' },
    { id: 's-5', firstName: 'Дмитрий', lastName: 'Васильев' },
];

const students9B: Student[] = [
    { id: 's-6', firstName: 'Ольга', lastName: 'Соколова' },
    { id: 's-7', firstName: 'Петр', lastName: 'Михайлов' },
    { id: 's-8', firstName: 'Анна', lastName: 'Новикова' },
    { id: 's-9', firstName: 'Сергей', lastName: 'Федоров' },
];

// Initial subject data
const subjects7A: Subject[] = [
    { id: 'sub-c-1-1', name: 'Алгебра' },
    { id: 'sub-c-1-2', name: 'Английский язык' },
];

const subjects9B: Subject[] = [
    { id: 'sub-c-2-1', name: 'Геометрия' },
    { id: 'sub-c-2-2', name: 'История' },
];

// Initial class data
const classes: Class[] = [
    { id: 'c-1', name: '7А', students: students7A, subjects: subjects7A },
    { id: 'c-2', name: '9Б', students: students9B, subjects: subjects9B },
];

// Generate lessons for all subjects based on schedule
const today = new Date();
const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

const allLessons: Lesson[] = [];
classes.forEach(c => {
    const classSchedule = initialSchedule.filter(s => s.classId === c.id);
    allLessons.push(...generateLessonsForSchedule(classSchedule, c.subjects, startDate, endDate));
});


// Pre-populate some lessons with details
const lesson1ToUpdate = allLessons.find(l => l.subjectId === 'sub-c-1-1' && new Date(l.date).getDate() >=2 && new Date(l.date).getDate() <= 8 && new Date(l.date).getDay() === 4); // Find a Thursday lesson for Algebra
if (lesson1ToUpdate) {
    lesson1ToUpdate.topic = 'Изучение дробей';
    lesson1ToUpdate.lessonType = 'SOR';
    lesson1ToUpdate.maxPoints = 20;
    lesson1ToUpdate.homework = 'Упр. 2, стр. 35';
}
const lesson2ToUpdate = allLessons.find(l => l.subjectId === 'sub-c-1-1' && new Date(l.date).getDate() >=2 && new Date(l.date).getDate() <= 8 && new Date(l.date).getDay() === 6); // Find a Saturday lesson for Algebra
if (lesson2ToUpdate) {
    lesson2ToUpdate.topic = 'Контрольная работа';
    lesson2ToUpdate.lessonType = 'Class Work';
    lesson2ToUpdate.homework = 'Повторить тему №2';
}


// Generate initial grades/attendance for all students for all lessons
const allGrades: Grade[] = [];
let gradeIdCounter = 1;
classes.forEach(c => {
    const classLessons = allLessons.filter(l => c.subjects.some(s => s.id === l.subjectId));
    c.students.forEach(student => {
        classLessons.forEach(lesson => {
            const attendance: AttendanceStatus[] = ['present', 'present', 'present', 'present', 'absent', 'excused'];
            const randomAttendance = attendance[Math.floor(Math.random() * attendance.length)];
            
            let randomGrade: number | undefined = undefined;
            if (randomAttendance === 'present') {
                const maxPoints = lesson.maxPoints ?? 10;
                randomGrade = Math.floor(Math.random() * (maxPoints + 1));
            }

            allGrades.push({
                id: `g-${gradeIdCounter++}`,
                studentId: student.id,
                lessonId: lesson.id,
                grade: randomGrade,
                attendance: randomAttendance,
                comment: randomAttendance === 'excused' ? 'По болезни' : '',
            });
        });
    });
});

// Set specific grades for prepopulated lessons
if (lesson1ToUpdate) {
    const grade1 = allGrades.find(g => g.lessonId === lesson1ToUpdate.id && g.studentId === 's-1');
    if (grade1) { grade1.grade = 18; grade1.attendance = 'present'; }
    const grade2 = allGrades.find(g => g.lessonId === lesson1ToUpdate.id && g.studentId === 's-2');
    if (grade2) { grade2.attendance = 'absent'; grade2.grade = undefined; }
    const grade3 = allGrades.find(g => g.lessonId === lesson1ToUpdate.id && g.studentId === 's-3');
    if (grade3) { grade3.attendance = 'excused'; grade3.grade = undefined; grade3.comment = 'Олимпиада'; }
}

export const initialData: AppData = {
    classes,
    lessons: allLessons,
    grades: allGrades,
    schedule: initialSchedule,
};


'use server';

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from './db';
import { classes, students, subjects, scheduleItems, lessons, grades, messages, academicYears, quarters } from './schema';
import { revalidatePath } from 'next/cache';
import { eq, and, inArray, desc, gte, lte } from 'drizzle-orm';
import { z } from 'zod';
import { alias } from "drizzle-orm/pg-core";
import { finalGrades } from './schema';

export type FormState = {
  message: string;
};

export async function login(_prevState: FormState, formData: FormData): Promise<FormState> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (email === "Vladislav" && password === "Vladislav15") {
    await cookies().set("auth", "true", { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/' });
    redirect("/dashboard");
  } else {
    return { message: "Неверный логин или пароль" };
  }
}

export async function logout() {
  cookies().set("auth", "", { expires: new Date(0) });
  redirect("/");
}


// --- Actions for Classes, Students, Subjects ---

export async function addClass(name: string) {
  if (!name.trim()) return { error: "Название класса не может быть пустым." };
  try {
    await db.insert(classes).values({ name });
    revalidatePath('/dashboard/classes');
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/results');
    return { success: true };
  } catch (error) {
    console.error("Failed to add class:", error);
    return { error: "Не удалось добавить класс. Возможно, класс с таким названием уже существует." };
  }
}

export async function deleteClass(classId: number) {
  try {
    // Manually delete related items in correct order
    const studentsToDelete = await db.query.students.findMany({ where: eq(students.classId, classId), columns: { id: true }});
    if (studentsToDelete.length > 0) {
        const studentIds = studentsToDelete.map(s => s.id);
        await db.delete(grades).where(inArray(grades.studentId, studentIds));
        await db.delete(finalGrades).where(inArray(finalGrades.studentId, studentIds));
    }

    const subjectsToDelete = await db.query.subjects.findMany({ where: eq(subjects.classId, classId), columns: { id: true } });
    if (subjectsToDelete.length > 0) {
      const subjectIds = subjectsToDelete.map(s => s.id);
      
      const lessonsToDelete = await db.query.lessons.findMany({ where: inArray(lessons.subjectId, subjectIds), columns: { id: true } });
      if (lessonsToDelete.length > 0) {
        const lessonIds = lessonsToDelete.map(l => l.id);
        await db.delete(grades).where(inArray(grades.lessonId, lessonIds));
      }
      
      await db.delete(lessons).where(inArray(lessons.subjectId, subjectIds));
      await db.delete(scheduleItems).where(inArray(scheduleItems.subjectId, subjectIds));
      await db.delete(subjects).where(eq(subjects.classId, classId));
      await db.delete(finalGrades).where(inArray(finalGrades.subjectId, subjectIds));
    }
    
    await db.delete(students).where(eq(students.classId, classId));
    await db.delete(classes).where(eq(classes.id, classId));
    
    revalidatePath('/dashboard/classes');
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/attendance');
    revalidatePath('/dashboard/schedule');
    revalidatePath('/dashboard/messages');
    revalidatePath('/dashboard/results');
    return { success: true };
  } catch (error) {
    console.error("Failed to delete class:", error);
    return { error: "Не удалось удалить класс." };
  }
}

export async function addStudent(firstName: string, lastName: string, classId: number) {
  if (!firstName.trim() || !lastName.trim() || !classId) {
    return { error: "Имя, фамилия и класс обязательны." };
  }
  try {
    const newStudent = await db.insert(students).values({ firstName, lastName, classId }).returning({ id: students.id });
    
    // When a new student is added, we need to create grade entries for all existing lessons for that subject
    const studentId = newStudent[0].id;
    const classSubjects = await db.query.subjects.findMany({where: eq(subjects.classId, classId), columns: {id: true}});
    if (classSubjects.length > 0) {
        const subjectIds = classSubjects.map(s => s.id);
        const existingLessons = await db.query.lessons.findMany({where: inArray(lessons.subjectId, subjectIds), columns: {id: true}});

        if (existingLessons.length > 0) {
            const gradePromises = existingLessons.map(lesson => 
                db.insert(grades).values({ studentId: studentId, lessonId: lesson.id, attendance: 'present' })
            );
            await Promise.all(gradePromises);
        }
    }

    revalidatePath('/dashboard/classes');
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/attendance');
    revalidatePath('/dashboard/results');
    return { success: true };
  } catch (error) {
    console.error("Failed to add student:", error);
    return { error: "Не удалось добавить ученика." };
  }
}

export async function deleteStudent(studentId: number) {
  try {
    await db.delete(grades).where(eq(grades.studentId, studentId));
    await db.delete(finalGrades).where(eq(finalGrades.studentId, studentId));
    await db.delete(students).where(eq(students.id, studentId));
    revalidatePath('/dashboard/classes');
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/attendance');
    revalidatePath('/dashboard/results');
    return { success: true };
  } catch (error) {
    console.error("Failed to delete student:", error);
    return { error: "Не удалось удалить ученика." };
  }
}

export async function addSubject(name: string, classId: number) {
  if (!name.trim() || !classId) {
    return { error: "Название предмета и класс обязательны." };
  }
  try {
    await db.insert(subjects).values({ name, classId });
    revalidatePath('/dashboard/classes');
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/schedule');
    revalidatePath('/dashboard/results');
    return { success: true };
  } catch (error) {
    console.error("Failed to add subject:", error);
    return { error: "Не удалось добавить предмет. Возможно, он уже существует в этом классе." };
  }
}

export async function deleteSubject(subjectId: number) {
  try {
    // Manually delete related items 
    const lessonsToDelete = await db.select({ id: lessons.id }).from(lessons).where(eq(lessons.subjectId, subjectId));
    if (lessonsToDelete.length > 0) {
        const lessonIds = lessonsToDelete.map(l => l.id);
        await db.delete(grades).where(inArray(grades.lessonId, lessonIds));
    }
    await db.delete(lessons).where(eq(lessons.subjectId, subjectId));
    await db.delete(scheduleItems).where(eq(scheduleItems.subjectId, subjectId));
    await db.delete(finalGrades).where(eq(finalGrades.subjectId, subjectId));
    await db.delete(subjects).where(eq(subjects.id, subjectId));

    revalidatePath('/dashboard/classes');
    revalidatePath('/dashboard/schedule');
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/results');
    return { success: true };
  } catch (error) {
    console.error("Failed to delete subject:", error);
    return { error: "Не удалось удалить предмет." };
  }
}


// --- Schedule Actions ---
const ScheduleSchema = z.object({
  classId: z.coerce.number(),
  dayOfWeek: z.string().min(1, "День недели обязателен"),
  lessonNumber: z.coerce.number().min(1),
  subjectId: z.coerce.number(),
});

export async function addScheduleItem(formData: FormData) {
  const validatedFields = ScheduleSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { error: "Неверные данные." };
  }
  
  try {
    await db.insert(scheduleItems).values(validatedFields.data);
    revalidatePath('/dashboard/schedule');
    return { success: true };
  } catch (error) {
    console.error("Failed to add schedule item:", error);
    return { error: "Не удалось добавить урок в расписание." };
  }
}

export async function deleteScheduleItem(itemId: number) {
    try {
        await db.delete(scheduleItems).where(eq(scheduleItems.id, itemId));
        revalidatePath('/dashboard/schedule');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete schedule item:", error);
        return { error: "Не удалось удалить урок из расписания." };
    }
}

// --- Message Actions ---

const MessageSchema = z.object({
    recipient: z.string().min(1, "Получатель обязателен"),
    message: z.string().min(1, "Сообщение не может быть пустым"),
});

export async function sendMessage(formData: FormData) {
    const validatedFields = MessageSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return { error: "Неверные данные." };
    }

    const { recipient, message } = validatedFields.data;
    const [type, idStr] = recipient.split('-');
    const id = parseInt(idStr);

    let recipientName: string;
    let recipientType: 'class' | 'student';

    if (type === 'class') {
        const aClass = await db.query.classes.findFirst({ where: eq(classes.id, id) });
        if (!aClass) return { error: "Класс не найден." };
        recipientName = aClass.name;
        recipientType = 'class';
    } else if (type === 'student') {
        const student = await db.query.students.findFirst({ where: eq(students.id, id) });
        if (!student) return { error: "Ученик не найден." };
        recipientName = `${student.firstName} ${student.lastName}`;
        recipientType = 'student';
    } else {
        return { error: "Неверный тип получателя." };
    }

    try {
        await db.insert(messages).values({
            recipientId: recipient,
            recipientName,
            recipientType,
            message,
        });
        revalidatePath('/dashboard/messages');
        return { success: true };
    } catch (error) {
        console.error("Failed to send message:", error);
        return { error: "Не удалось отправить сообщение." };
    }
}

export async function deleteMessage(messageId: number) {
    try {
        await db.delete(messages).where(eq(messages.id, messageId));
        revalidatePath('/dashboard/messages');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete message:", error);
        return { error: "Не удалось удалить сообщение." };
    }
}

// --- Gradebook Actions ---
export async function createLesson(subjectId: number, date: Date) {
    try {
        const subject = await db.query.subjects.findFirst({ where: eq(subjects.id, subjectId), with: { class: { with: { students: true } } } });
        if (!subject) {
            return { error: 'Предмет не найден' };
        }

        const newLesson = await db.insert(lessons).values({ subjectId, date }).returning({ id: lessons.id });
        const lessonId = newLesson[0].id;
        
        // For each student in the class, create a new grade entry
        const studentsInClass = subject.class.students;
        if (studentsInClass.length > 0) {
            const gradePromises = studentsInClass.map(student => 
                db.insert(grades).values({ studentId: student.id, lessonId, attendance: 'present' })
            );
            await Promise.all(gradePromises);
        }

        revalidatePath('/dashboard');
        return { success: true, lessonId };
    } catch (error) {
        console.error('Failed to create lesson:', error);
        return { error: 'Не удалось создать урок.' };
    }
}

export async function deleteLesson(lessonId: number) {
    try {
        // First delete all grades associated with this lesson
        await db.delete(grades).where(eq(grades.lessonId, lessonId));
        // Then delete the lesson itself
        await db.delete(lessons).where(eq(lessons.id, lessonId));
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete lesson:", error);
        return { error: "Не удалось удалить урок." };
    }
}


const GradeSchema = z.object({
  gradeId: z.coerce.number(),
  studentId: z.coerce.number(),
  lessonId: z.coerce.number(),
  grade: z.coerce.number().optional().nullable(),
  attendance: z.enum(['present', 'absent', 'excused']),
  comment: z.string().optional().nullable(),
});
export async function updateGrade(formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    const gradeValue = rawData.grade ? Number(rawData.grade) : null;

    const validatedFields = GradeSchema.safeParse({
        ...rawData,
        grade: gradeValue
    });
    
    if (!validatedFields.success) {
        console.error(validatedFields.error.flatten().fieldErrors);
        return { error: "Неверные данные для оценки." };
    }
    const { gradeId, ...data } = validatedFields.data;

    try {
        await db.update(grades).set(data).where(eq(grades.id, gradeId));
        revalidatePath('/dashboard');
        revalidatePath('/dashboard/attendance');
        revalidatePath('/dashboard/results');
        return { success: true };
    } catch (error) {
        console.error("Failed to update grade:", error);
        return { error: "Не удалось обновить оценку." };
    }
}

const LessonSchema = z.object({
    lessonId: z.coerce.number(),
    topic: z.string().default("Тема не задана"),
    homework: z.string().default(""),
    lessonType: z.enum(['Class Work', 'Independent Work', 'Project Work', 'SOR', 'SOCH', 'Default']),
    maxPoints: z.preprocess((val) => val ? Number(val) : null, z.number().optional().nullable()),
});

export async function updateLesson(formData: FormData) {
    const validatedFields = LessonSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        console.error(validatedFields.error.flatten().fieldErrors);
        return { error: "Неверные данные для урока." };
    }
    const { lessonId, ...data } = validatedFields.data;
     if (data.lessonType === 'Default') {
        data.maxPoints = null;
    }

    try {
        await db.update(lessons).set(data).where(eq(lessons.id, lessonId));
        revalidatePath('/dashboard');
        revalidatePath('/dashboard/results');
        return { success: true };
    } catch (error) {
        console.error("Failed to update lesson:", error);
        return { error: "Не удалось обновить урок." };
    }
}

// --- Results / Final Grades Actions ---

const YearSchema = z.object({
  name: z.string().regex(/^\d{4}-\d{4}$/, "Формат должен быть ГГГГ-ГГГГ"),
});

export async function addAcademicYear(formData: FormData) {
    const validatedFields = YearSchema.safeParse({ name: formData.get('name') });
    if (!validatedFields.success) {
        return { error: validatedFields.error.flatten().fieldErrors.name?.[0] };
    }
    const { name } = validatedFields.data;

    try {
        await db.insert(academicYears).values({ name });
        revalidatePath('/dashboard/results');
        return { success: true };
    } catch (e) {
        return { error: "Не удалось создать учебный год. Возможно, он уже существует." };
    }
}

const QuarterSchema = z.object({
  name: z.string().min(1, "Название четверти обязательно"),
  academicYearId: z.coerce.number(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export async function addQuarter(formData: FormData) {
  const validatedFields = QuarterSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    console.log(validatedFields.error.flatten().fieldErrors);
    return { error: "Неверные данные. Убедитесь, что все поля заполнены." };
  }
  
  try {
    await db.insert(quarters).values(validatedFields.data);
    revalidatePath('/dashboard/results');
    return { success: true };
  } catch (error) {
    console.error("Failed to add quarter:", error);
    return { error: "Не удалось добавить четверть." };
  }
}


export async function deleteAcademicYear(yearId: number) {
    try {
        const quartersToDelete = await db.query.quarters.findMany({ where: eq(quarters.academicYearId, yearId), columns: { id: true }});
        if (quartersToDelete.length > 0) {
            const quarterIds = quartersToDelete.map(q => q.id);
            await db.delete(finalGrades).where(and(eq(finalGrades.periodType, 'quarter'), inArray(finalGrades.academicPeriodId, quarterIds)));
        }
        await db.delete(finalGrades).where(and(eq(finalGrades.periodType, 'year'), eq(finalGrades.academicPeriodId, yearId)));
        await db.delete(quarters).where(eq(quarters.academicYearId, yearId));
        await db.delete(academicYears).where(eq(academicYears.id, yearId));
        
        revalidatePath('/dashboard/results');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete academic year:", error);
        return { error: "Не удалось удалить учебный год." };
    }
}

export async function deleteQuarter(quarterId: number) {
    try {
        await db.delete(finalGrades).where(and(eq(finalGrades.periodType, 'quarter'), eq(finalGrades.academicPeriodId, quarterId)));
        await db.delete(quarters).where(eq(quarters.id, quarterId));
        revalidatePath('/dashboard/results');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete quarter:", error);
        return { error: "Не удалось удалить четверть." };
    }
}


const FinalGradeSchema = z.object({
  studentId: z.coerce.number(),
  subjectId: z.coerce.number(),
  academicPeriodId: z.coerce.number(),
  periodType: z.enum(['quarter', 'year', 'exam']),
  grade: z.coerce.number().min(2).max(5),
});

export async function setFinalGrade(formData: FormData) {
    const validatedFields = FinalGradeSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        console.error(validatedFields.error.flatten().fieldErrors);
        return { error: "Неверные данные для итоговой оценки." };
    }

    const { studentId, subjectId, academicPeriodId, periodType, grade } = validatedFields.data;

    const quarterId = periodType === 'quarter' ? academicPeriodId : null;

    try {
        await db.insert(finalGrades)
            .values({ studentId, subjectId, academicPeriodId, periodType, grade, quarterId })
            .onConflictDoUpdate({
                target: [finalGrades.studentId, finalGrades.subjectId, finalGrades.academicPeriodId, finalGrades.periodType],
                set: { grade: grade }
            });
        
        revalidatePath('/dashboard/results');
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        console.error("Failed to set final grade:", error);
        return { error: "Не удалось сохранить оценку." };
    }
}


// --- Data Export ---
export async function exportData(format: 'json' | 'csv') {
    try {
        const allClasses = await db.query.classes.findMany();
        const allStudents = await db.query.students.findMany();
        const allSubjects = await db.query.subjects.findMany();
        const allSchedule = await db.query.scheduleItems.findMany();
        const allLessons = await db.query.lessons.findMany();
        const allGrades = await db.query.grades.findMany();

        const allData = {
            classes: allClasses,
            students: allStudents,
            subjects: allSubjects,
            schedule: allSchedule,
            lessons: allLessons,
            grades: allGrades,
        };

        let dataStr: string;
        let fileName: string;
        let mimeType: string;

        if (format === 'json') {
            dataStr = JSON.stringify(allData, null, 2);
            fileName = 'gradebook_export.json';
            mimeType = 'application/json';
        } else {
             const studentMap = new Map(allStudents.map(s => [s.id, s]));
            const lessonMap = new Map(allLessons.map(l => [l.id, l]));
            const subjectMap = new Map(allSubjects.map(s => [s.id, s]));
            const classMap = new Map(allClasses.map(c => [c.id, c]));

            const headers = "Student,Class,Subject,Date,Topic,Grade,Attendance,Comment";
            const rows = allData.grades.map(grade => {
                const student = studentMap.get(grade.studentId);
                const lesson = lessonMap.get(grade.lessonId);
                const subject = lesson ? subjectMap.get(lesson.subjectId) : undefined;
                const studentClass = student ? classMap.get(student.classId) : undefined;

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
        
        return { success: true, dataStr, fileName, mimeType };

    } catch (error) {
        console.error("Export failed:", error);
        return { error: "Не удалось подготовить данные для экспорта." };
    }
}

    

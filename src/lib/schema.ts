

import { pgTable, serial, varchar, integer, text, date as pgDate, uniqueIndex, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// --- Основные таблицы ---

// Таблица классов
export const classes = pgTable('classes', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 256 }).notNull().unique(),
});

export const classesRelations = relations(classes, ({ many }) => ({
	students: many(students),
    subjects: many(subjects),
}));


// Таблица учеников
export const students = pgTable('students', {
  id: serial('id').primaryKey(),
  firstName: varchar('first_name', { length: 256 }).notNull(),
  lastName: varchar('last_name', { length: 256 }).notNull(),
  classId: integer('class_id').references(() => classes.id, { onDelete: 'cascade' }).notNull(),
});

export const studentsRelations = relations(students, ({ one, many }) => ({
	class: one(classes, {
		fields: [students.classId],
		references: [classes.id],
	}),
    grades: many(grades),
    finalGrades: many(finalGrades),
}));


// Таблица предметов
export const subjects = pgTable('subjects', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 256 }).notNull(),
    classId: integer('class_id').references(() => classes.id, { onDelete: 'cascade' }).notNull(),
}, (table) => {
    return {
        nameClassIdUnq: uniqueIndex('name_class_id_unq').on(table.name, table.classId),
    };
});

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
	class: one(classes, {
		fields: [subjects.classId],
		references: [classes.id],
	}),
    lessons: many(lessons),
    finalGrades: many(finalGrades),
}));


// --- Таблицы для журнала ---

// Таблица расписания
export const scheduleItems = pgTable('schedule_items', {
    id: serial('id').primaryKey(),
    classId: integer('class_id').references(() => classes.id, { onDelete: 'cascade' }).notNull(),
    dayOfWeek: varchar('day_of_week', { length: 50 }).notNull(), // Понедельник, Вторник...
    lessonNumber: integer('lesson_number').notNull(),
    subjectId: integer('subject_id').references(() => subjects.id, { onDelete: 'cascade' }).notNull(),
});

// Таблица уроков
export const lessons = pgTable('lessons', {
  id: serial('id').primaryKey(),
  subjectId: integer('subject_id').references(() => subjects.id, { onDelete: 'cascade' }).notNull(),
  date: pgDate('date', { mode: 'date' }).notNull(),
  topic: text('topic').notNull().default('Тема не задана'),
  homework: text('homework').notNull().default(''),
  lessonType: varchar('lesson_type', { length: 50 }).notNull().default('Default'),
  maxPoints: integer('max_points'),
});

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
	subject: one(subjects, {
		fields: [lessons.subjectId],
		references: [subjects.id],
	}),
    grades: many(grades),
}));


// Таблица оценок
export const grades = pgTable('grades', {
    id: serial('id').primaryKey(),
    studentId: integer('student_id').references(() => students.id, { onDelete: 'cascade' }).notNull(),
    lessonId: integer('lesson_id').references(() => lessons.id, { onDelete: 'cascade' }).notNull(),
    grade: integer('grade'),
    attendance: varchar('attendance', { length: 50 }).notNull().default('present'),
    comment: text('comment'),
}, (table) => {
    return {
        studentLessonUnq: uniqueIndex('student_lesson_unq').on(table.studentId, table.lessonId),
    };
});

export const gradesRelations = relations(grades, ({ one }) => ({
	student: one(students, {
		fields: [grades.studentId],
		references: [students.id],
	}),
    lesson: one(lessons, {
        fields: [grades.lessonId],
		references: [lessons.id],
    })
}));


// --- Таблицы для итогов ---

// Таблица учебных годов
export const academicYears = pgTable('academic_years', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 9 }).notNull().unique(), // "2023-2024"
});

export const academicYearsRelations = relations(academicYears, ({ many }) => ({
    quarters: many(quarters),
}));

// Таблица четвертей
export const quarters = pgTable('quarters', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 50 }).notNull(), // "1-я четверть"
    academicYearId: integer('academic_year_id').references(() => academicYears.id, { onDelete: 'cascade' }).notNull(),
    startDate: pgDate('start_date', { mode: 'date' }).notNull(),
    endDate: pgDate('end_date', { mode: 'date' }).notNull(),
});

export const quartersRelations = relations(quarters, ({ one, many }) => ({
    academicYear: one(academicYears, {
        fields: [quarters.academicYearId],
        references: [academicYears.id],
    }),
    finalGrades: many(finalGrades),
}));

// Таблица итоговых оценок
export const finalGrades = pgTable('final_grades', {
    id: serial('id').primaryKey(),
    studentId: integer('student_id').references(() => students.id, { onDelete: 'cascade' }).notNull(),
    subjectId: integer('subject_id').references(() => subjects.id, { onDelete: 'cascade' }).notNull(),
    academicPeriodId: integer('academic_period_id').notNull(), // ID из quarters или academic_years
    periodType: varchar('period_type', { length: 50, enum: ['quarter', 'year', 'exam'] }).notNull(),
    grade: integer('grade').notNull(),
    quarterId: integer('quarter_id').references(() => quarters.id, { onDelete: 'set null' }),
}, (table) => {
    return {
        finalGradeUnq: uniqueIndex('final_grade_unq').on(table.studentId, table.subjectId, table.academicPeriodId, table.periodType),
    };
});

export const finalGradesRelations = relations(finalGrades, ({ one }) => ({
    student: one(students, {
        fields: [finalGrades.studentId],
        references: [students.id],
    }),
    subject: one(subjects, {
        fields: [finalGrades.subjectId],
        references: [subjects.id],
    }),
    quarter: one(quarters, {
        fields: [finalGrades.quarterId],
        references: [quarters.id],
    }),
}));


// --- Прочие таблицы ---

// Таблица сообщений
export const messages = pgTable('messages', {
    id: serial('id').primaryKey(),
    recipientId: text('recipient_id').notNull(), // 'class-1' or 'student-6'
    recipientName: varchar('recipient_name', { length: 256 }).notNull(),
    recipientType: varchar('recipient_type', { length: 50 }).notNull(), // 'class' or 'student'
    message: text('message').notNull(),
    timestamp: timestamp('timestamp', { mode: 'date' }).notNull().defaultNow(),
});

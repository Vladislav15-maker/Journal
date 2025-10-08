import { pgTable, serial, varchar, integer, text, date as pgDate, uniqueIndex } from 'drizzle-orm/pg-core';

// Таблица классов
export const classes = pgTable('classes', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 256 }).notNull().unique(),
});

// Таблица учеников
export const students = pgTable('students', {
  id: serial('id').primaryKey(),
  firstName: varchar('first_name', { length: 256 }).notNull(),
  lastName: varchar('last_name', { length: 256 }).notNull(),
  classId: integer('class_id').references(() => classes.id, { onDelete: 'cascade' }).notNull(),
});

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
  date: pgDate('date').notNull(),
  topic: text('topic').notNull().default('Тема не задана'),
  homework: text('homework').notNull().default(''),
  lessonType: varchar('lesson_type', { length: 50 }).notNull().default('Default'),
  maxPoints: integer('max_points'),
});

// Таблица оценок
export const grades = pgTable('grades', {
    id: serial('id').primaryKey(),
    studentId: integer('student_id').references(() => students.id, { onDelete: 'cascade' }).notNull(),
    lessonId: integer('lesson_id').references(() => lessons.id, { onDelete: 'cascade' }).notNull(),
    grade: integer('grade'),
    attendance: varchar('attendance', { length: 50 }).notNull().default('present'),
    comment: text('comment'),
});

// Таблица сообщений
export const messages = pgTable('messages', {
    id: serial('id').primaryKey(),
    recipientId: text('recipient_id').notNull(), // 'class-1' or 'student-6'
    recipientName: varchar('recipient_name', { length: 256 }).notNull(),
    recipientType: varchar('recipient_type', { length: 50 }).notNull(), // 'class' or 'student'
    message: text('message').notNull(),
    timestamp: pgDate('timestamp', { mode: 'date' }).notNull().defaultNow(),
});

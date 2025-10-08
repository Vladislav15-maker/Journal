'use server';

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from './db';
import { classes, students, subjects, scheduleItems, lessons, grades } from './schema';
import { revalidatePath } from 'next/cache';
import { eq, and, inArray } from 'drizzle-orm';

export type FormState = {
  message: string;
};

export async function login(_prevState: FormState, formData: FormData): Promise<FormState> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (email === "Vladislav" && password === "Vladislav15") {
    cookies().set("auth", "true", { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/' });
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
    return { success: true };
  } catch (error) {
    console.error("Failed to add class:", error);
    return { error: "Не удалось добавить класс. Возможно, класс с таким названием уже существует." };
  }
}

export async function deleteClass(classId: number) {
  try {
    // This will cascade and delete related students, subjects, etc. if schema is set up correctly
    await db.delete(classes).where(eq(classes.id, classId));
    revalidatePath('/dashboard/classes');
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
    await db.insert(students).values({ firstName, lastName, classId });
    revalidatePath('/dashboard/classes');
    return { success: true };
  } catch (error) {
    console.error("Failed to add student:", error);
    return { error: "Не удалось добавить ученика." };
  }
}

export async function deleteStudent(studentId: number) {
  try {
    // Associated grades will be deleted by cascade
    await db.delete(students).where(eq(students.id, studentId));
    revalidatePath('/dashboard/classes');
    revalidatePath('/dashboard');
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
    return { success: true };
  } catch (error) {
    console.error("Failed to add subject:", error);
    return { error: "Не удалось добавить предмет. Возможно, он уже существует в этом классе." };
  }
}

export async function deleteSubject(subjectId: number) {
  try {
    // Manually delete related items if cascade is not fully relied upon
    const lessonsToDelete = await db.select({ id: lessons.id }).from(lessons).where(eq(lessons.subjectId, subjectId));
    const lessonIds = lessonsToDelete.map(l => l.id);
    
    if (lessonIds.length > 0) {
        await db.delete(grades).where(inArray(grades.lessonId, lessonIds));
    }
    await db.delete(lessons).where(eq(lessons.subjectId, subjectId));
    await db.delete(scheduleItems).where(eq(scheduleItems.subjectId, subjectId));
    await db.delete(subjects).where(eq(subjects.id, subjectId));

    revalidatePath('/dashboard/classes');
    revalidatePath('/dashboard/schedule');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error("Failed to delete subject:", error);
    return { error: "Не удалось удалить предмет." };
  }
}
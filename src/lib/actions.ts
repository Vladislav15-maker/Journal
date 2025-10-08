"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

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

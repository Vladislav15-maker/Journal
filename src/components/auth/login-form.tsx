"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { login, type FormState } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Вход..." : "Войти"}
    </Button>
  );
}

export function LoginForm() {
  const initialState: FormState = { message: "" };
  const [state, dispatch] = useActionState(login, initialState);

  return (
    <form action={dispatch} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Логин</Label>
        <Input
          id="email"
          name="email"
          placeholder="Vladislav"
          required
          defaultValue="Vladislav"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Пароль</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          defaultValue="Vladislav15"
        />
      </div>
      {state.message && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ошибка входа</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      <SubmitButton />
    </form>
  );
}

import { LoginForm } from "@/components/auth/login-form";
import { Logo } from "@/components/icons/logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <Logo className="h-12 w-12 text-primary" />
          <CardTitle className="font-headline text-2xl pt-4">
            GradeBook Pro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}

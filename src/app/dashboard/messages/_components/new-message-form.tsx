
'use client';
import React, { useRef } from 'react';
import { CardContent, CardFooter } from "@/components/ui/card";
import { Send, Users, User } from "lucide-react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { Class } from '@/lib/definitions';
import { sendMessage } from '@/lib/actions';
import { useFormStatus } from 'react-dom';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            <Send className="mr-2 h-4 w-4" />
            {pending ? 'Отправка...' : 'Отправить'}
        </Button>
    );
}

export function NewMessageForm({ classes }: { classes: Class[] }) {
    const formRef = useRef<HTMLFormElement>(null);
    const { toast } = useToast();

    const handleAction = async (formData: FormData) => {
        const result = await sendMessage(formData);

        if (result?.error) {
            toast({
                variant: 'destructive',
                title: 'Ошибка отправки',
                description: result.error,
            });
        } else {
            toast({
                title: 'Сообщение отправлено!',
            });
            formRef.current?.reset();
        }
    };
    
    return (
        <form action={handleAction} ref={formRef}>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <label htmlFor="recipient" className="text-sm font-medium">Кому:</label>
                    <Select name="recipient">
                        <SelectTrigger id="recipient" className="w-full">
                            <SelectValue placeholder="Выберите получателя..." />
                        </SelectTrigger>
                        <SelectContent>
                            {classes.map(c => (
                                <SelectGroup key={c.id}>
                                    <SelectLabel className="flex items-center gap-2">
                                        <Users className="h-4 w-4" /> Класс
                                    </SelectLabel>
                                    <SelectItem value={`class-${c.id}`}>{c.name} (всему классу)</SelectItem>
                                    {c.students.length > 0 && (
                                        <SelectLabel className="flex items-center gap-2 mt-2">
                                            <User className="h-4 w-4" /> Ученики из {c.name}
                                        </SelectLabel>
                                    )}
                                    {c.students.map(s => (
                                        <SelectItem key={s.id} value={`student-${s.id}`}>
                                            {s.lastName} {s.firstName}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <label htmlFor="message-text" className="text-sm font-medium">Сообщение:</label>
                    <Textarea 
                        id="message-text"
                        name="message"
                        placeholder="Введите ваше сообщение..." 
                        rows={6}
                        required
                    />
                </div>
            </CardContent>
            <CardFooter className="flex justify-end">
                <SubmitButton />
            </CardFooter>
        </form>
    )
}

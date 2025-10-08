
"use client";
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { MessageSquare, Send, Users, User, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { initialData } from '@/lib/data';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { AppData, Student, SentMessage } from '@/lib/definitions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';


export default function MessagesPage() {
    const [data] = useState<AppData>(initialData);
    const [sentMessages, setSentMessages] = useState<SentMessage[]>([]);
    const [selectedRecipient, setSelectedRecipient] = useState<string | null>(null);
    const [message, setMessage] = useState('');
    const { toast } = useToast();

    const handleSendMessage = () => {
        if (!selectedRecipient || !message.trim()) {
            toast({
                variant: 'destructive',
                title: 'Ошибка отправки',
                description: 'Пожалуйста, выберите получателя и введите сообщение.',
            });
            return;
        }

        let recipientName: string;
        let recipientType: 'class' | 'student';

        if (selectedRecipient.startsWith('class-')) {
            const classId = selectedRecipient.replace('class-', '');
            const aClass = data.classes.find(c => c.id === classId);
            recipientName = aClass?.name ?? 'Неизвестный класс';
            recipientType = 'class';
        } else {
            const student = data.classes.flatMap(c => c.students).find(s => s.id === selectedRecipient);
            recipientName = student ? `${student.firstName} ${student.lastName}` : 'Неизвестный ученик';
            recipientType = 'student';
        }

        const newMessage: SentMessage = {
            id: `msg-${new Date().getTime()}`,
            recipientId: selectedRecipient,
            recipientName,
            recipientType,
            message,
            timestamp: new Date().toISOString(),
        };

        setSentMessages(prev => [newMessage, ...prev]);

        console.log(`Sending message to ${recipientType} ${recipientName}: ${message}`);
        
        toast({
            title: 'Сообщение отправлено!',
            description: `Ваше сообщение для "${recipientName}" было успешно отправлено.`,
        });

        setMessage('');
        setSelectedRecipient(null);
    };
    
    const handleDeleteMessage = (messageId: string) => {
        setSentMessages(prev => prev.filter(msg => msg.id !== messageId));
        toast({
            title: 'Сообщение удалено',
        });
    };

    return (
        <div className="grid md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare /> Новое сообщение
                    </CardTitle>
                    <CardDescription>
                        Отправка личных сообщений ученикам или всему классу.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="student-select" className="text-sm font-medium">Кому:</label>
                        <Select value={selectedRecipient ?? ''} onValueChange={setSelectedRecipient}>
                            <SelectTrigger id="student-select" className="w-full">
                                <SelectValue placeholder="Выберите получателя..." />
                            </SelectTrigger>
                            <SelectContent>
                                {data.classes.map(c => (
                                    <SelectGroup key={c.id}>
                                        <SelectLabel className="flex items-center gap-2">
                                            <Users className="h-4 w-4" /> Класс
                                        </SelectLabel>
                                        <SelectItem value={`class-${c.id}`}>{c.name} (всему классу)</SelectItem>
                                        <SelectLabel className="flex items-center gap-2 mt-2">
                                            <User className="h-4 w-4" /> Ученики из {c.name}
                                        </SelectLabel>
                                        {c.students.map(s => (
                                            <SelectItem key={s.id} value={s.id}>
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
                            placeholder="Введите ваше сообщение..." 
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={6}
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button onClick={handleSendMessage} disabled={!selectedRecipient || !message.trim()}>
                        <Send className="mr-2 h-4 w-4" />
                        Отправить
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>История сообщений</CardTitle>
                    <CardDescription>Список отправленных вами сообщений.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[400px]">
                        {sentMessages.length > 0 ? (
                            <div className="space-y-4">
                                {sentMessages.map((msg, index) => (
                                    <React.Fragment key={msg.id}>
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={msg.recipientType === 'class' ? 'default' : 'secondary'}>
                                                        {msg.recipientType === 'class' ? <Users className="mr-1 h-3 w-3" /> : <User className="mr-1 h-3 w-3" />}
                                                        {msg.recipientName}
                                                    </Badge>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(msg.timestamp).toLocaleString('ru-RU')}
                                                    </p>
                                                </div>
                                                <p className="text-sm">{msg.message}</p>
                                            </div>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Это действие навсегда удалит это сообщение из истории.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteMessage(msg.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                            Удалить
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                        {index < sentMessages.length - 1 && <Separator />}
                                    </React.Fragment>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground h-full flex items-center justify-center">
                                <p>Вы еще не отправляли сообщений.</p>
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}

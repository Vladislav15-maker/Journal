
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { MessageSquare, Send, Users, User, Trash2 } from "lucide-react";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/db';
import { desc } from 'drizzle-orm';
import { messages } from '@/lib/schema';
import { NewMessageForm } from './_components/new-message-form';
import { DeleteMessageButton } from './_components/message-actions';

export default async function MessagesPage() {
    const allClasses = await db.query.classes.findMany({
        with: {
            students: true,
        },
    });

    const sentMessages = await db.query.messages.findMany({
        orderBy: [desc(messages.timestamp)],
    });

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
                <NewMessageForm classes={allClasses} />
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
                                            <DeleteMessageButton messageId={msg.id} />
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


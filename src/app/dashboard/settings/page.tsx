
"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Settings, FileJson, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { exportData } from "@/lib/actions";


export default function SettingsPage() {
    const { toast } = useToast();

    const handleExport = async (format: 'json' | 'csv') => {
        const result = await exportData(format);
        
        if (result.error) {
            toast({
                variant: "destructive",
                title: "Ошибка экспорта",
                description: result.error,
            });
            return;
        }

        try {
            const { dataStr, fileName, mimeType } = result;
            const blob = new Blob([dataStr!], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName!;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            toast({
                title: "Экспорт успешен",
                description: `Данные были выгружены в файл ${fileName}.`,
            });
        } catch (error) {
            console.error("Export failed:", error);
            toast({
                variant: "destructive",
                title: "Ошибка экспорта",
                description: "Не удалось выгрузить данные на клиенте.",
            });
        }
    };


    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Settings /> Настройки
                </CardTitle>
                <CardDescription>
                    Настройки приложения и экспорт данных.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <h3 className="text-lg font-medium mb-4">Экспорт данных</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Вы можете выгрузить все данные журнала в формате JSON или CSV.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button variant="outline" onClick={() => handleExport('json')}>
                        <FileJson className="mr-2 h-4 w-4" />
                        Экспорт в JSON
                    </Button>
                    <Button variant="outline" onClick={() => handleExport('csv')}>
                        <FileText className="mr-2 h-4 w-4" />
                        Экспорт в CSV
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}


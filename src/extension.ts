// тянем все нужные апишки из самого редактора
import * as vscode from 'vscode';

// самописный хэш на основе классического алгоритма djb2
function hashString(str: string): number {
    // начальное дефолтное число для этого алгоритма
    let hash = 5381;
    // крутим цикл по каждому символу в переданной строке
    for (let i = 0; i < str.length; i++) {
        // сдвиг влево на 5 и плюс hash — это быстрое умножение на 33 без вызова math
        // а charcodeat берет числовой код текущей буквы из таблицы
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }
    // выплевываем получившееся целое число
    return hash;
}

// тут перегоняем название папки в понятный для css цвет
function getWorkspaceColor(folderName: string): string {
    // берем хэш от названия и умножаем на 137 (золотой угол), чтобы соседние папки типа lab1 и lab2 не сливались
    // остаток от деления на 360 дает угол на цветовом круге от 0 до 359
    // math.abs страхует от отрицательного числа, если хэш переполнится
    const hue = Math.abs((hashString(folderName) * 137) % 360);
    
    // собираем готовую hsl строчку: угол наш, а насыщенность (45%) и яркость (18%) захардкодил, чтобы тема была мягкой и темной
    return `hsl(${hue}, 45%, 18%)`;
}

// функция которая лезет в настройки редактора и красит интерфейс
function updateColor() {
    // смотрим массив открытых папок в текущем окне
    const folders = vscode.workspace.workspaceFolders;
    // если открыли просто пустой редактор без воркспейса
    if (!folders || folders.length === 0) {
        // то сразу выходим, красить нечего
        return;
    }

    // берем имя самой первой корневой папки
    const folderName = folders[0].name;
    // генерим для нее цвет через функцию выше
    const color = getWorkspaceColor(folderName);

    // подключаемся к разделу настроек внешнего вида (workbench)
    const config = vscode.workspace.getConfiguration('workbench');
    // обновляем параметр colorcustomizations
    config.update(
        'colorCustomizations',
        {
            // красим верхний заголовок окна
            'titleBar.activeBackground': color,
            // красим боковую панель где иконки файлов и гита
            'activityBar.background': color,
            // и красим нижнюю полоску со статусом
            'statusBar.background': color
        },
        // этот флаг критически важен: пишем только в локальный .vscode/settings.json этого проекта, чтобы не ломать общую тему редактора
        vscode.ConfigurationTarget.Workspace
    );
}

// главная точка входа, редактор сам вызывает ее при старте плагина
export function activate(context: vscode.ExtensionContext) {
    // сразу при запуске красим окно под текущую папку
    updateColor();

    // регистрируем команду в палитре (cmd+shift+p), чтобы можно было руками дернуть пересчет
    const disposable = vscode.commands.registerCommand('workspaceChroma.rehash', () => {
        // внутри просто вызываем ту же функцию обновления
        updateColor();
    });

    // закидываем команду в подписки контекста, чтобы vs code сам выгрузил ее из памяти при отключении плагина
    context.subscriptions.push(disposable);
}

// вызывается при деактивации плагина
export function deactivate() {
    // тут ничего чистить не нужно, никаких фоновых таймеров или веб-сокетов не висит
}
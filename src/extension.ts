import * as vscode from 'vscode';

function hashString(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
        hash = hash & hash;
    }
    return Math.abs(hash);
}

function hslToHex(h: number, s: number, l: number): string {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

async function applyChromaColor() {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
        return;
    }

    const folderName = folders[0].name;
    const hash = hashString(folderName);
    const hue = hash % 360;

    const statusBarColor = hslToHex(hue, 50, 20);
    const titleBarColor = hslToHex(hue, 45, 14);

    const config = vscode.workspace.getConfiguration('workbench');
    const existing = config.get<Record<string, string>>('colorCustomizations') || {};

    await config.update(
        'colorCustomizations',
        {
            ...existing,
            'statusBar.background': statusBarColor,
            'statusBar.noFolderBackground': statusBarColor,
            'titleBar.activeBackground': titleBarColor,
            'activityBar.background': titleBarColor
        },
        vscode.ConfigurationTarget.Workspace
    );
}

export function activate(context: vscode.ExtensionContext) {
    applyChromaColor();

    const command = vscode.commands.registerCommand('workspaceChroma.rehash', () => {
        applyChromaColor();
        vscode.window.showInformationMessage('Workspace Chroma: Color re-calculated.');
    });

    context.subscriptions.push(command);
}

export function deactivate() {}

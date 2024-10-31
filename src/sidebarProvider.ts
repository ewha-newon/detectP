import * as vscode from 'vscode';

export class FuzzingResultTreeDataProvider implements vscode.TreeDataProvider<FuzzingResult> {
    private _onDidChangeTreeData: vscode.EventEmitter<FuzzingResult | undefined | null | void> = new vscode.EventEmitter<FuzzingResult | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<FuzzingResult | undefined | null | void> = this._onDidChangeTreeData.event;
    
    private results: FuzzingResult[] = [];
    public refresh() {
        this._onDidChangeTreeData.fire();
    }

    public getTreeItem(element: FuzzingResult): vscode.TreeItem {
        return element;
    }
    
    public getChildren(element?: FuzzingResult): Thenable<FuzzingResult[]> {
        if (element) {
            return Promise.resolve([]);
        } else {
            return Promise.resolve(this.results);
        }
    }

    public addResult(result: FuzzingResult) {
        this.results.push(result);
        this.refresh();
    }

    public clearResults() {
        this.results = [];
        this.refresh();
    }
}

export class FuzzingResult extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly description?: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None,
        public readonly success: boolean = false 
    ) {
        super(label, collapsibleState);
        this.tooltip = description || '';
        this.label = success ? `🫢 ${label}` : `🛡️ ${label}`;  // 성공과 실패 아이콘을 다르게 표시
    }
}

export class DetectResultTreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private results: vscode.TreeItem[] = [];

    public refresh() {
        this._onDidChangeTreeData.fire();
    }

    public getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    public getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        if (element) {
            return Promise.resolve([]);
        } else {
            return Promise.resolve(this.results);
        }
    }

    public addResult(result: vscode.TreeItem) {
        this.results.push(result);
        this.refresh();
    }

    public clearResults() {
        this.results = [];
        this.refresh();
    }
}

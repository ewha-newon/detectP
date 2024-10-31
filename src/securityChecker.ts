import * as vscode from 'vscode';

export function checkSecurityIssues(document: vscode.TextDocument): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];
    const sourceCode = document.getText();

    // 정규 표현식 패턴들
    const patterns = [
        {
            pattern: /\bdocument\.cookie\b/g,
            message: 'Potential Security Issue: Direct use of cookies',
        },
        {
            pattern: /\bprocess\.env\b/g,
            message: 'Potential Security Issue: Direct use of environment variables',
        },
        {
            pattern: /\.getElementById\(['"]([^'"]*hidden[^'"]*)['"]\)/g,
            message: 'Potential Security Issue: Use of hidden fields',
        },
        {
            pattern: /192\.168|file:\/\//g,
            message: 'Potential SSRF Attack: Suspicious URL',
        },
        {
            pattern: /\bhide\b/g,
            message: 'Warning: Found "hide" string',
        },
    ];

    // 정규 표현식을 사용하여 검사 수행
    patterns.forEach(({ pattern, message }) => {
        let match;
        while ((match = pattern.exec(sourceCode)) !== null) {
            const startPosition = document.positionAt(match.index);
            const endPosition = document.positionAt(match.index + match[0].length);

            const diagnostic = new vscode.Diagnostic(
                new vscode.Range(startPosition, endPosition),
                message,
                message.includes('Warning') ? vscode.DiagnosticSeverity.Warning : vscode.DiagnosticSeverity.Error
            );

            diagnostics.push(diagnostic);
        }
    });

    return diagnostics;
}

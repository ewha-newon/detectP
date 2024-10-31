import * as vscode from 'vscode';

export function checkCSRFToken(document: vscode.TextDocument): { message: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number }[] {
    const diagnostics: { message: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number }[] = [];
    const text = document.getText();
    const lines = text.split('\n');

    // CSRF 취약점이 있는 HTTP 메서드
    const csrfVulnerableMethods = ['POST', 'PUT', 'DELETE'];

    lines.forEach((line, lineNumber) => {
        const trimmedLine = line.trim();

        // POST 요청 확인
        if (trimmedLine.startsWith('app.post(')) {
            // CSRF 토큰 존재 여부 확인
            const csrfTokenMatch = text.match(/req\.headers\['x-csrf-token'\]/i);

            // CSRF 토큰이 없는 경우
            if (!csrfTokenMatch) {
                const range = new vscode.Range(lineNumber, 0, lineNumber, line.length);
                diagnostics.push({
                    message: '잠재적인 CSRF 취약점 탐지: POST 요청에 CSRF 토큰이 없습니다.',
                    startLine: lineNumber,
                    startCharacter: 0,
                    endLine: lineNumber,
                    endCharacter: line.length
                });
            }
        }
    });

    return diagnostics;
}


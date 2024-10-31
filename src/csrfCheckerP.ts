import * as vscode from 'vscode';
export function checkCSRFTokenPython(document: vscode.TextDocument): { message: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number }[] {
    const issues: { message: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number }[] = [];
    const text = document.getText();
    const lines = text.split('\n');

    const csrfVulnerableMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
    const csrfTokenIdentifiers = ['csrf_token', 'xsrf_token', '_csrf', '_xsrf'];

    lines.forEach((line, lineNumber) => {
        const trimmedLine = line.trim();

        if (trimmedLine.includes('request.method')) {
            const methodUsed = csrfVulnerableMethods.some(method => trimmedLine.includes(`'${method}'`) || trimmedLine.includes(`"${method}"`));

            if (methodUsed) {
                const csrfTokenPresent = csrfTokenIdentifiers.some(token => text.includes(token));

                if (!csrfTokenPresent) {
                    issues.push({
                        message: 'CSRF 보호가 누락된 HTTP 메소드가 감지되었습니다. CSRF 토큰을 추가하세요.',
                        startLine: lineNumber,
                        startCharacter: 0,
                        endLine: lineNumber,
                        endCharacter: line.length
                    });
                }
            }
        }
    });

    return issues;
}

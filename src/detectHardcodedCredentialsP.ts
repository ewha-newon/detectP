// detectHardcodedCredentialsP.ts
export function detectHardcodedCredentials(code: string) {
    const issues = [];
    const regex = /(password\s*=\s*['"].+['"]|api_key\s*=\s*['"].+['"])/g; // 하드코딩된 비밀번호 및 API 키 탐지

    let match;
    while ((match = regex.exec(code)) !== null) {
        const startPos = match.index;
        const lines = code.substring(0, startPos).split('\n');
        const startLine = lines.length - 1;
        const startCharacter = lines[startLine].length;
        const endCharacter = startCharacter + match[0].length;

        issues.push({
            message: "하드코딩된 자격 증명이 있습니다. 환경 변수를 사용하세요.",
            startLine: startLine,
            startCharacter: startCharacter,
            endLine: startLine,
            endCharacter: endCharacter
        });
    }

    return issues;
}

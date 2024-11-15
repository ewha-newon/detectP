import * as vscode from 'vscode';
import * as path from 'path';

import { detectEval } from './detectEval';
import { detectEvalPython } from './detectEvalP';
import { detectPathTraversal } from './detectPathTraversal';
import { detectPathTraversalPython } from './detectPathTraversalP';
import { detectSourceInjection } from './detectSourceInjection';
import { detectSourceInjectionPython } from './detectSourceInjectionP';
import { detectXMLInjection } from './detectXMLInjection';
import { detectXMLInjectionPython } from './detectXMLInjectionP';
import { detectLDAPInjection } from './detectLDAPInjection';
import { detectLDAPInjectionPython } from './detectLDAPInjectionP';
import { checkCSRFToken } from './csrfChecker';
import { checkCSRFTokenPython } from './csrfCheckerP';
import { detectHardcodedCredentials } from './detectHardcodedCredentialsP';
import { checkSecurityIssues } from './securityChecker';
import { fuzz } from './fuzzer';

import { getChatGptResponse } from './ai';
import { FuzzingResultTreeDataProvider, FuzzingResult} from './sidebarProvider';

export function activate(context: vscode.ExtensionContext) {

    console.log('Congratulations, your extension "newon" is now active!');

	const disposable = vscode.commands.registerCommand('newon.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from newon!');
	});
    const fuzzingResultProvider = new FuzzingResultTreeDataProvider();
    vscode.window.registerTreeDataProvider('extension.fuzzingResultView', fuzzingResultProvider);

    const fuzzCommand = vscode.commands.registerCommand('newon.fuzz', async () => {
        const url = await vscode.window.showInputBox({
            placeHolder: 'Enter the target URL',
        });
 
        if (url) {
            let outputFilePath: string | undefined;

            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (workspaceFolders && workspaceFolders.length > 0) {
                outputFilePath = path.join(workspaceFolders[0].uri.fsPath, 'fuzzing-results.txt');
            } else {
                const uri = await vscode.window.showSaveDialog({
                    saveLabel: 'Save Fuzzing Results',
                    filters: {
                        'Text Files': ['txt'],
                        'All Files': ['*']
                    },
                    defaultUri: vscode.Uri.file('fuzzing-results.txt')
                });

                if (uri) {
                    outputFilePath = uri.fsPath;
                } else {
                    vscode.window.showErrorMessage('No file path provided.');
                    return;
                }
            }
            // Fuzzing 결과를 저장하고, 성공 및 오류 결과로 분리
        const results = await fuzz(url, outputFilePath,fuzzingResultProvider);

        // 결과를 분리
        const successResults: FuzzingResult[] = [];
        const errorResults: FuzzingResult[] = [];

        results.forEach(result => {
            if (result.success) {
                successResults.push(result);
            } else {
                errorResults.push(result);
            }
        });

        // 트리 데이터에 추가
        successResults.forEach(result => fuzzingResultProvider.addResult(result));
        errorResults.forEach(result => fuzzingResultProvider.addResult(result));

        // 결과를 모두 추가한 후 트리 새로고침
        fuzzingResultProvider.refresh();
    } else {
        vscode.window.showErrorMessage('No URL provided.');
    }
});

    const detectAllCommand = vscode.commands.registerCommand('newon.detectAll', () => {
        const editor = vscode.window.activeTextEditor;
    if (editor) {
        const document = editor.document;
        const code = document.getText();

        // 타입 명시
        let allResults: { message: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number }[] = [];

        if (document.languageId === 'javascript') {
            const evalResults = detectEval(code);
            const pathTraversalResults = detectPathTraversal(code);
            const sourceInjectionResults = detectSourceInjection(code);
            const xmlInjectionResults = detectXMLInjection(code);
            const ldapInjectionResults = detectLDAPInjection(code);
            const csrfResults = checkCSRFToken(document);

            allResults = [
                ...evalResults,
                ...pathTraversalResults,
                ...sourceInjectionResults,
                ...xmlInjectionResults,
                ...ldapInjectionResults,
                ...csrfResults
            ];
        } else if (document.languageId === 'python') {
            const evalResults = detectEvalPython(code);
            const pathTraversalResults = detectPathTraversalPython(code);
            const sourceInjectionResults = detectSourceInjectionPython(code);
            const xmlInjectionResults = detectXMLInjectionPython(code);
            const ldapInjectionResults = detectLDAPInjectionPython(code);
            const csrfResults = checkCSRFTokenPython(document);
            const hardcodingCredentialResults = detectHardcodedCredentials(code); 

            allResults = [
                ...evalResults,
                ...pathTraversalResults,
                ...sourceInjectionResults,
                ...csrfResults,
                ...hardcodingCredentialResults
            ];
        }

            if (allResults.length > 0) {
                highlightSecurityIssues(editor, allResults);
                reportSecurityIssues(document, allResults); // Report to Problems panel
            } else {
                vscode.window.showInformationMessage('취약점이 감지되지 않았습니다.');
            }
        }
    });

    const diagnosticsCollection = vscode.languages.createDiagnosticCollection('securityChecker');
    
    const decorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255, 255, 0, 0.3)', // Yellow highlight with some transparency
        border: '1px solid yellow',
        borderRadius: '2px',
    });
    
    function clearHighlight(editor: vscode.TextEditor) {
        editor.setDecorations(decorationType, []); // 빈 배열로 기존 하이라이트 제거
    }
    
    function highlightSecurityIssues(editor: vscode.TextEditor, issues: any[]) {
        clearHighlight(editor); // 기존 하이라이트 제거
    
        const decorations: vscode.DecorationOptions[] = issues.map(issue => {
            const start = new vscode.Position(issue.startLine, issue.startCharacter);
            const end = new vscode.Position(issue.endLine, issue.endCharacter);
            const range = new vscode.Range(start, end);
    
            return { range };
        });
    
        editor.setDecorations(decorationType, decorations);
    }
    

    function reportSecurityIssues(document: vscode.TextDocument, issues: any[]) {
        const diagnostics: vscode.Diagnostic[] = [];

        issues.forEach(issue => {
            const start = new vscode.Position(issue.startLine, issue.startCharacter);
            const end = new vscode.Position(issue.endLine, issue.endCharacter);
            const range = new vscode.Range(start, end);

            const diagnostic = new vscode.Diagnostic(
                range,
                issue.message || 'No message provided',  // Ensure message is set
                vscode.DiagnosticSeverity.Warning
            );

            diagnostics.push(diagnostic);
        });

        diagnosticsCollection.set(document.uri, diagnostics);
    }

    let timeout: NodeJS.Timeout | undefined;

    vscode.workspace.onDidChangeTextDocument((event) => {
        const document = event.document;
        
        if (document.languageId === 'javascript' || document.languageId === 'python') {
            if (timeout) {
                clearTimeout(timeout);
            }
    
            timeout = setTimeout(() => {
                const editor = vscode.window.activeTextEditor;
                if (editor) {
                    let allResults: { message: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number }[] = [];
    
                    if (document.languageId === 'javascript') {
                        const evalResults = detectEval(document.getText());
                        const pathTraversalResults = detectPathTraversal(document.getText());
                        const sourceInjectionResults = detectSourceInjection(document.getText());
                        const xmlInjectionResults = detectXMLInjection(document.getText());
                        const ldapInjectionResults = detectLDAPInjection(document.getText());
                        const csrfResults = checkCSRFToken(document);
    
                        allResults = [
                            ...evalResults,
                            ...pathTraversalResults,
                            ...sourceInjectionResults,
                            ...xmlInjectionResults,
                            ...ldapInjectionResults,
                            ...csrfResults
                        ];
                    } else if (document.languageId === 'python') {
                        const evalResults = detectEvalPython(document.getText());
                        const pathTraversalResults = detectPathTraversalPython(document.getText());
                        const sourceInjectionResults = detectSourceInjectionPython(document.getText());
                        const xmlInjectionResults = detectXMLInjectionPython(document.getText());
                        const ldapInjectionResults = detectLDAPInjectionPython(document.getText());
                        const csrfResults = checkCSRFTokenPython(document);
                        const hardcodingCredentialResults = detectHardcodedCredentials(document.getText()); 
    
                        allResults = [
                            ...evalResults,
                            ...pathTraversalResults,
                            ...sourceInjectionResults,
                            ...xmlInjectionResults,
                            ...ldapInjectionResults,
                            ...csrfResults,
                            ...hardcodingCredentialResults
                        ];
                    }
    
                    highlightSecurityIssues(editor, allResults);
                    reportSecurityIssues(document, allResults);
                }
            }, 500); // debounce time of 500ms
        }
    });
    

    vscode.workspace.onDidSaveTextDocument((document) => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const code = document.getText();
            let allResults: { message: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number }[] = [];
    
            if (document.languageId === 'javascript') {
                const evalResults = detectEval(code);
                const pathTraversalResults = detectPathTraversal(code);
                const sourceInjectionResults = detectSourceInjection(code);
                const xmlInjectionResults = detectXMLInjection(code);
                const ldapInjectionResults = detectLDAPInjection(code);
                const csrfResults = checkCSRFToken(document);
    
                allResults = [
                    ...evalResults,
                    ...pathTraversalResults,
                    ...sourceInjectionResults,
                    ...xmlInjectionResults,
                    ...ldapInjectionResults,
                    ...csrfResults
                ];
            } else if (document.languageId === 'python') {
                const evalResults = detectEvalPython(code);
                const pathTraversalResults = detectPathTraversalPython(code);
                const sourceInjectionResults = detectSourceInjectionPython(code);
                const xmlInjectionResults = detectXMLInjectionPython(code);
                const ldapInjectionResults = detectLDAPInjectionPython(code);
                const csrfResults = checkCSRFTokenPython(document);
                const hardcodingCredentialResults = detectHardcodedCredentials(code); 
                allResults = [
                    ...evalResults,
                    ...pathTraversalResults,
                    ...sourceInjectionResults,
                    ...xmlInjectionResults,
                    ...ldapInjectionResults,
                    ...csrfResults,
                    ...hardcodingCredentialResults
                ];
            }
    
            highlightSecurityIssues(editor, allResults);
            reportSecurityIssues(document, allResults);
        }
    });
    
    const aiCommand = vscode.commands.registerCommand('newon.ai', async () => {
		// 현재 활성화된 에디터 가져오기
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('현재 열려있는 파일이 없습니다.');
            return;
        }

        // 현재 파일의 코드 가져오기
        const code = editor.document.getText();

        try {
			// ChatGPT API에서 개선된 코드 가져오기
			const improvedCode = await getChatGptResponse(code);
            console.log("improved code: ", improvedCode);

            // 기존 코드 텍스트 문서 생성
            const oldDocument = await vscode.workspace.openTextDocument({ content: code });
            const newDocument = await vscode.workspace.openTextDocument({ content: improvedCode });

            // diff view를 통해 두 코드 비교
            await vscode.commands.executeCommand('vscode.diff', oldDocument.uri, newDocument.uri, 'Original Code ↔ Improved Code');

			

		} catch (error) {
			console.error('ChatGPT API 호출 중 오류가 발생했습니다:', error);
			vscode.window.showErrorMessage('ChatGPT API 호출 중 오류가 발생했습니다.');
		}
	});

    console.log('Security Checker is now active!');

    // Extension cleanup
    context.subscriptions.push(diagnosticsCollection);
    context.subscriptions.push(disposable);
    context.subscriptions.push(fuzzCommand);
    context.subscriptions.push(detectAllCommand);
    context.subscriptions.push(aiCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}

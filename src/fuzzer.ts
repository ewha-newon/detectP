import * as vscode from 'vscode';
import axios from 'axios';
import * as fs from 'fs';
import { FuzzingResult, FuzzingResultTreeDataProvider } from './sidebarProvider'; // Adjust the path if necessary

const payloads = [
    { payload: "' OR '1'='1", type: "SQL Injection Vulnerability - Tautology" },
    { payload: "'; DROP TABLE users; --", type: "SQL Injection Vulnerability - Drop Table" },
    { payload: "<script>alert(1)</script>", type: "Cross-Site Scripting (XSS) Vulnerability" },
    { payload: "../../etc/passwd", type: "Path Traversal Vulnerability" },
    { payload: "%00", type: "Null Byte Injection Vulnerability" }
];

export async function fuzz(url: string, outputFilePath: string, fuzzingResultProvider: FuzzingResultTreeDataProvider): Promise<FuzzingResult[]> {
    fuzzingResultProvider.clearResults();
    const results: FuzzingResult[] = [];

    for (const payloadObj of payloads) {
        const payload = payloadObj.payload;
        const payloadType = payloadObj.type;
        try {
            const response = await axios.get(`${url}?input=${encodeURIComponent(payload)}`);
            const isSuccess = response.status === 200; // 성공 여부 결정
            const resultText = `Payload: ${payload}\nType: ${payloadType}\nResponse: ${response.status} - ${response.statusText}\n\n`;
            results.push(new FuzzingResult(payloadType, resultText, vscode.TreeItemCollapsibleState.None, isSuccess));
        } catch (error) {
            const errorMessage = `Payload: ${payload}\nType: ${payloadType}\nError: ${error instanceof Error ? error.message : 'An unknown error occurred.'}\n\n`;
            results.push(new FuzzingResult(payloadType, errorMessage, vscode.TreeItemCollapsibleState.None, false));
        }
    }

    // Write the results to a text file
    const fileContents = results.map(result => result.tooltip).join('\n');
    fs.writeFileSync(outputFilePath, fileContents, 'utf8');

    // Open the file in a new editor tab
    const document = await vscode.workspace.openTextDocument(outputFilePath);
    await vscode.window.showTextDocument(document);

    return results;
}

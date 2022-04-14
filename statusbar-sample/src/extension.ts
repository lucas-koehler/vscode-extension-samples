/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/


import * as vscode from 'vscode';

let myStatusBarItem: vscode.StatusBarItem;

export function activate({ subscriptions }: vscode.ExtensionContext) {
	console.log('StatusBarItem test extension was activated');
	
	// register a command that is invoked when the status bar
	// item is selected
	const myCommandId = 'sample.showSelectionCount';
	subscriptions.push(vscode.commands.registerCommand(myCommandId, () => {
		const n = getNumberOfSelectedLines(vscode.window.activeTextEditor);
		vscode.window.showInformationMessage(`${n} line(s) selected! StatusBarItem.name: ${myStatusBarItem.name}. StatusBarItem.id: ${myStatusBarItem.id}`);
	}));

	// create a new status bar item that we can now manage
	myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	myStatusBarItem.command = myCommandId;
	myStatusBarItem.name = 'Selected Lines Count';
	subscriptions.push(myStatusBarItem);

	// register some listener that make sure the status bar 
	// item always up-to-date
	subscriptions.push(vscode.window.onDidChangeActiveTextEditor(updateStatusBarItem));
	subscriptions.push(vscode.window.onDidChangeTextEditorSelection(updateStatusBarItem));

	// update status bar item once at start
	updateStatusBarItem();
}

function updateStatusBarItem(): void {
	const n = getNumberOfSelectedLines(vscode.window.activeTextEditor);
	myStatusBarItem.show();
	myStatusBarItem.text = `$(megaphone) ${n} line(s) selected`;
	myStatusBarItem.color = '#0000FF';
	if (n === 0) {
		myStatusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
	} else if (n < 3) {
		myStatusBarItem.backgroundColor = undefined;
	} else {
		myStatusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
	}
}

function getNumberOfSelectedLines(editor: vscode.TextEditor | undefined): number {
	let lines = 0;
	if (editor) {
		lines = editor.selections.reduce((prev, curr) => prev + (curr.end.line - curr.start.line), 0);
	}
	return lines;
}

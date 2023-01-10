'use strict';

import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	let NEXT_TERM_ID = 1;

	console.log("Terminals: " + (<any>vscode.window).terminals.length);

	// creation of transient and regular terminals
	context.subscriptions.push(vscode.commands.registerCommand('terminalTest.createTransient', () => {
		const options: vscode.TerminalOptions = { name: `Transient Ext Terminal #${NEXT_TERM_ID++}`, isTransient: true };
		const terminal = vscode.window.createTerminal(options);
		terminal.show();
	}));

	context.subscriptions.push(vscode.commands.registerCommand('terminalTest.create', () => {
		const options: vscode.TerminalOptions = { name: `Non-Transient Ext Terminal #${NEXT_TERM_ID++}` };
		const terminal = vscode.window.createTerminal(options);
		terminal.show();
	}));
}

function selectTerminal(): Thenable<vscode.Terminal | undefined> {
	interface TerminalQuickPickItem extends vscode.QuickPickItem {
		terminal: vscode.Terminal;
	}
	const terminals = <vscode.Terminal[]>(<any>vscode.window).terminals;
	const items: TerminalQuickPickItem[] = terminals.map(t => {
		return {
			label: `name: ${t.name}`,
			terminal: t
		};
	});
	return vscode.window.showQuickPick(items).then(item => {
		return item ? item.terminal : undefined;
	});
}

function ensureTerminalExists(): boolean {
	if ((<any>vscode.window).terminals.length === 0) {
		vscode.window.showErrorMessage('No active terminals');
		return false;
	}
	return true;
}

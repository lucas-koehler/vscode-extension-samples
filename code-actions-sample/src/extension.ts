/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as vscode from 'vscode';
import { subscribeToDocumentChanges, EMOJI_MENTION } from './diagnostics';

const COMMAND = 'code-actions-sample.command';

const DOCUMENTATION_COMMAND = 'code-actions-sample.documentation';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider('markdown', new Emojizer(), {
			providedCodeActionKinds: Emojizer.providedCodeActionKinds,
			documentation: [
				{
					kind: vscode.CodeActionKind.QuickFix,
					command: {
						title: 'Learn more about Emojis...',
						command: DOCUMENTATION_COMMAND,
						tooltip: 'Opens wikipedia to teach you about Emojis.'
				}}
			]
		}));

	const emojiDiagnostics = vscode.languages.createDiagnosticCollection("emoji");
	context.subscriptions.push(emojiDiagnostics);

	subscribeToDocumentChanges(context, emojiDiagnostics);

	context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider('markdown', new Emojinfo(), {
			providedCodeActionKinds: Emojinfo.providedCodeActionKinds
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(COMMAND, () => vscode.env.openExternal(vscode.Uri.parse('https://unicode.org/emoji/charts-12.0/full-emoji-list.html'))),
		vscode.commands.registerCommand(DOCUMENTATION_COMMAND, () => vscode.env.openExternal(vscode.Uri.parse('https://en.wikipedia.org/wiki/Emoji')))
	);
}

type EmojizerCodeAction = vscode.CodeAction | ResolvableCodeAction;

class ResolvableCodeAction extends vscode.CodeAction {
	constructor(
		title: string,
		readonly emoji: string,
		readonly document: vscode.TextDocument,
		readonly range: vscode.Range,
		kind?: vscode.CodeActionKind) {
		super(title, kind);
	}

	public async resolve(): Promise<void> {
		console.debug(`Resolving code action ${this.title}`);
		this.edit = new vscode.WorkspaceEdit();
		this.edit.replace(this.document.uri, new vscode.Range(this.range.start, this.range.start.translate(0, 2)), this.emoji);
		return;
	}
}

/**
 * Provides code actions for converting :) to a smiley emoji.
 */
export class Emojizer implements vscode.CodeActionProvider<EmojizerCodeAction> {

	public static readonly providedCodeActionKinds = [
		vscode.CodeActionKind.QuickFix
	];

	public provideCodeActions(document: vscode.TextDocument, range: vscode.Range): EmojizerCodeAction[] | undefined {
		if (!this.isAtStartOfSmiley(document, range)) {
			return;
		}

		const replaceWithSmileyCatFix = this.createFix(document, range, '😺');

		const replaceWithSmileyFix = this.createFix(document, range, '😀');
		// Marking a single fix as `preferred` means that users can apply it with a
		// single keyboard shortcut using the `Auto Fix` command.
		replaceWithSmileyFix.isPreferred = true;

		const replaceWithSmileyHankyFix = this.createFix(document, range, '💩');
		replaceWithSmileyHankyFix.disabled = { reason: 'Smells too bad.' };

		const commandAction = this.createCommand();

		return [
			replaceWithSmileyCatFix,
			replaceWithSmileyFix,
			replaceWithSmileyHankyFix,
			commandAction
		];
	}

	public async resolveCodeAction(codeAction: EmojizerCodeAction, token: vscode.CancellationToken): Promise<EmojizerCodeAction> {
		console.debug('Emojizer.resolveCodeAction was called for code action', JSON.stringify(codeAction));
		if (codeAction instanceof ResolvableCodeAction) {
			await codeAction.resolve();
		}
		return codeAction;
	}

	private isAtStartOfSmiley(document: vscode.TextDocument, range: vscode.Range) {
		const start = range.start;
		const line = document.lineAt(start.line);
		return line.text[start.character] === ':' && line.text[start.character + 1] === ')';
	}

	private createFix(document: vscode.TextDocument, range: vscode.Range, emoji: string): ResolvableCodeAction {
		return new ResolvableCodeAction(`Convert to ${emoji}`, emoji, document, range, vscode.CodeActionKind.QuickFix);
	}

	private createCommand(): vscode.CodeAction {
		const action = new vscode.CodeAction('Learn more...', vscode.CodeActionKind.Empty);
		action.command = { command: COMMAND, title: 'Learn more about emojis', tooltip: 'This will open the unicode emoji page.' };
		return action;
	}
}

/**
 * Provides code actions corresponding to diagnostic problems.
 */
export class Emojinfo implements vscode.CodeActionProvider {

	public static readonly providedCodeActionKinds = [
		vscode.CodeActionKind.QuickFix
	];

	provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection, context: vscode.CodeActionContext, token: vscode.CancellationToken): vscode.CodeAction[] {
		// for each diagnostic entry that has the matching `code`, create a code action command
		return context.diagnostics
			.filter(diagnostic => diagnostic.code === EMOJI_MENTION)
			.map(diagnostic => this.createCommandCodeAction(diagnostic));
	}

	private createCommandCodeAction(diagnostic: vscode.Diagnostic): vscode.CodeAction {
		const action = new vscode.CodeAction('Learn more...', vscode.CodeActionKind.QuickFix);
		action.command = { command: COMMAND, title: 'Learn more about emojis', tooltip: 'This will open the unicode emoji page.' };
		action.diagnostics = [diagnostic];
		action.isPreferred = true;
		return action;
	}
}
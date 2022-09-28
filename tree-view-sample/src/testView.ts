import * as vscode from 'vscode';

export class TestView {

	constructor(context: vscode.ExtensionContext) {
		const view = vscode.window.createTreeView('testView', { treeDataProvider: aNodeWithIdTreeDataProvider(), showCollapseAll: true });
		context.subscriptions.push(view);
		vscode.commands.registerCommand('testView.reveal', async () => {
			const key = await vscode.window.showInputBox({ placeHolder: 'Type the label of the item to reveal' });
			if (key) {
				await view.reveal({ key }, { focus: true, select: false, expand: true });
			}
		});
		vscode.commands.registerCommand('testView.changeTitle', async () => {
			const title = await vscode.window.showInputBox({ prompt: 'Type the new title for the Test View', placeHolder: view.title });
			if (title) {
				view.title = title;
			}
		});
		vscode.commands.registerCommand('testView.message.a', async (args: any[]) => {
			vscode.window.showInformationMessage(`Command A with args: ${args}`);
		});
		vscode.commands.registerCommand('testView.message.b', async (args: any[]) => {
			vscode.window.showInformationMessage(`Command B with args: ${args}`);
		});
	}
}

const tree = {
	'a': {
		'aa': {
			'aaa': {
				'aaaa': {
					'aaaaa': {
						'aaaaaa': {

						}
					}
				}
			}
		},
		'ab': {}
	},
	'b': {
		'ba': {},
		'bb': {}
	}
};
const nodes = {};

function aNodeWithIdTreeDataProvider(): vscode.TreeDataProvider<{ key: string }> {
	return {
		getChildren: (element: { key: string }): { key: string }[] => {
			return getChildren(element ? element.key : undefined).map(key => getNode(key));
		},
		getTreeItem: (element: { key: string }): vscode.TreeItem => {
			const treeItem = getTreeItem(element.key);
			treeItem.id = element.key;
			return treeItem;
		},
		getParent: ({ key }: { key: string }): { key: string } => {
			const parentKey = key.substring(0, key.length - 1);
			return parentKey ? new Key(parentKey) : void 0;
		},
		resolveTreeItem: (item: vscode.TreeItem, element: { key: string }, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TreeItem> => {
			console.log(`[tree-item-resolve] Resolving tree item for element: ${element.key}`);
			item.command = item.command ?? {
				command: 'testView.message.a',
				title: 'Test View: Message A',
				arguments: [element.key]
			};
			item.tooltip = item.tooltip ?? new vscode.MarkdownString(`$(zap) Resolved Tooltip for ${element.key}`, true);
			// Return delayed for item 'aa'
			if (element.key === 'aa') {
				return new Promise(resolve => {
					setTimeout(() => {
						resolve(item);
					}, 50);
				});
			}
			return item;
		}
	};
}

function getChildren(key: string): string[] {
	if (!key) {
		return Object.keys(tree);
	}
	const treeElement = getTreeElement(key);
	if (treeElement) {
		return Object.keys(treeElement);
	}
	return [];
}

function getTreeItem(key: string): vscode.TreeItem {
	const treeElement = getTreeElement(key);
	// b items are initialized with tooltip and command. Thus, they don't need resolving.
	if (key.startsWith('b')) {
		// An example of how to use codicons in a MarkdownString in a tree item tooltip.
		const tooltip = new vscode.MarkdownString(`$(zap) Tooltip for ${key}`, true);
		const command: vscode.Command = {
			command: 'testView.message.b',
			title: 'Test View: Message B',
			arguments: [key]
		};
		return {
			label: key,
			command,
			tooltip,
			collapsibleState: treeElement && Object.keys(treeElement).length ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
		};
	}

	return {
		label: key,
		collapsibleState: treeElement && Object.keys(treeElement).length ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
	};
}

function getTreeElement(element): any {
	let parent = tree;
	for (let i = 0; i < element.length; i++) {
		parent = parent[element.substring(0, i + 1)];
		if (!parent) {
			return null;
		}
	}
	return parent;
}

function getNode(key: string): { key: string } {
	if (!nodes[key]) {
		nodes[key] = new Key(key);
	}
	return nodes[key];
}

class Key {
	constructor(readonly key: string) { }
}
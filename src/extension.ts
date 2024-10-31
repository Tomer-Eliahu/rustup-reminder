// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

//Other Imports
import { readFileSync } from 'fs';
import { tmpdir } from "os";



// This method is called when your extension is activated (This is the entry point to the extension)
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated 
	//(your extension will be activated ONLY ONCE)
	console.log('Congratulations, your extension "rustup-reminder" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('rustup-reminder.helloWorld', () => {
		// The code you place here will be executed every time your command is executed

		const terminal = vscode.window.createTerminal({
			name: `Ext Terminal rustup-reminder`,
			hideFromUser: true
		});
		terminal.sendText("echo 'Sent text immediately after creating'", true);
		


		const TempDir = tmpdir();
		const FilePath= `${TempDir}\\RustUpReminderTempOutput.txt`;
		const command = `echo 'the path to the temp file is ${FilePath}'`;
		terminal.sendText(command, true);


		const write_command = `rustup check | Out-File -FilePath ${FilePath}`; //This works -- MVP achieved.
		terminal.sendText(write_command, true);

		terminal.show(); //Uncomment for Debugging

		//terminal.dispose(); //clean up the terminal-- comment out for debugging
		

		//Cont from here
		//const result = readFileSync("RustUpReminderTempOutput.txt");



		// Display a message box to the user
		vscode.window.showInformationMessage('Hello VS code from RustUp Reminder functionality branch!');
	});

	//run(); //TODO: uncomment later (if I run the extension using the command-- everything runs twice)

	context.subscriptions.push(disposable);
}

//execute the command we registered above
function run() {
	vscode.commands.executeCommand('rustup-reminder.helloWorld');
  }

// This method is called when your extension is deactivated
export function deactivate() {}


//TODO: **maybe** get rid of the contirbutes command in the package.json so that users can't run this extension manually
//via a command but only automatically when they open a rust file
//Or maybe just rename the command and let users have it if they want (in which case you keep it in the contributes and
//it auto generates the corresponding activation event).
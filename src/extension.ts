// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

//Other Imports
import { readFileSync } from 'fs';
import { tmpdir } from "os";
import { assert } from 'console';


// This method is called when your extension is activated (This is the entry point to the extension)
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated 
	//(your extension will be activated ONLY ONCE)
	console.log('Congratulations, your extension "rustup-reminder" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	//This command is empty on purpose. It exists so that we can test the extnesion by running it.
	//TODO: maybe later change the name of this so that the user can use this command to activate the extension as well without opening a rust file.
	context.subscriptions.push(vscode.commands.registerCommand('rustup-reminder.helloWorld', () => {}));

	// This command has NOT been defined in the package.json file -- it is not directly exposed to the user on purpose.
	const disposable = vscode.commands.registerCommand('rustup-reminder.run', () => {
		// The code you place here will be executed every time your command is executed

		const terminal = vscode.window.createTerminal({
			name: `Ext Terminal rustup-reminder`,
			hideFromUser: true
		});
		terminal.show(); //Uncomment for Debugging

		terminal.sendText("echo 'Sent text immediately after creating'", true);
		
		const TempDir = tmpdir();
		const FilePath= `${TempDir}\\RustUpReminderTempOutput.txt`;
		const command = `echo 'the path to the temp file is ${FilePath}'`;
		terminal.sendText(command, true);


		const write_command = `rustup check | Out-File -FilePath ${FilePath} -Encoding utf8`; //This works -- MVP achieved.
		terminal.sendText(write_command, true);
		//Note that without shell integration, we can't know when the command has finished execution. And shell intergration is not a given.
		//A fix might be to create a timestamped tempfile and then see if it exists. But then we just create masses of 1KB files we should
		//clean up. 
		//Alternatively by appending a 'finished execution' message to the file we can have just one 1KB file and see when rustup check is done.
		const finished_execution_command = `echo '\nRustUpReminder rustup check command finished' | Out-File -FilePath ${FilePath} -Encoding utf8 -Append`;
		terminal.sendText(finished_execution_command, true);


		//We open the file		
		const result = readFileSync(FilePath, { encoding: 'utf8', flag: 'r' }).trim(); //Note the trim here is important.
		console.log(`the file contents are \n${result}`);
		let result_array = result.split('\n'); //Note this doesn't impact result (result will still be the full file contents)

		let no_error = true; //if there is an error during execution, then we want to output a different message to the user
		let errors = "";//details the errors we encounterd that we want to surface to the user.
		let update_available = false;

		//See if the last line is the finished execution message. 
		//This way we know there was no data race in the writes to file and the commands finished properly.
		if ("RustUpReminder rustup check command finished" === result_array.pop())
		{
			
			//Note: We are checking for the output we expect based on the following file (see these specific tests for reference):
			//https://github.com/rust-lang/rustup/blob/708ffd6aeaa84d291d2a16cfd99bb45ae7e1e575/tests/suite/cli_exact.rs#L160 ,
			//https://github.com/rust-lang/rustup/blob/708ffd6aeaa84d291d2a16cfd99bb45ae7e1e575/tests/suite/cli_exact.rs#L179.
			
			let stable_arr = result_array.filter( (line: string) => {return line.startsWith("stable");} );
			console.log(`Identifed the last line correctly and stable_arr is ${stable_arr}`);
			if (stable_arr.length === 1) //There should be exactly one line that begins with stable
			{
				console.log("Got here");
				update_available = stable_arr[0].includes("Update available");
			}
			else
			{
				no_error = false;
				errors = `could not find or single out the line that details whether the stable version of Rust is up to date or not in:\n${result}`;
			}
			
		}
		else
		{
			no_error = false;
			errors = `expected the following to end with "RustUpReminder rustup check command finished" but instead got:\n${result}`;
		}

		//CONT FROM HERE
		
		//At this point we know if there is an update available to the stable version of Rust or not and whether we encountered any errors.

		//We get the values the user set for the extension settings
		const settings = vscode.workspace.getConfiguration();
		let setting_notify_up_to_date = settings.get('rustup-reminder.NotifyWhenUpToDate');
		let setting_update_when_possible = settings.get('rustup-reminder.UpdateWhenPossible');


		//terminal.dispose(); //clean up the terminal-- comment out for debugging
		
		
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello VS code from RustUp Reminder functionality branch!');
	});

	context.subscriptions.push(disposable);

	//execute the command we registered above
	vscode.commands.executeCommand('rustup-reminder.run');

}


// This method is called when your extension is deactivated
export function deactivate() {}


//TODO: **maybe** get rid of the contirbutes command in the package.json so that users can't run this extension manually
//via a command but only automatically when they open a rust file
//Or maybe just rename the command and let users have it if they want (in which case you keep it in the contributes and
//it auto generates the corresponding activation event).



//Some tangential notes

//This might be the way to run a command and wait for it to be finished:
//Note this relies on shell integration working and that is NOT a given (on my machine it always fails).

// // Execute a command in a terminal immediately after being created
// const myTerm = window.createTerminal();
// window.onDidChangeTerminalShellIntegration(async ({ terminal, shellIntegration }) => {
// if (terminal === myTerm) {
// 	const execution = shellIntegration.executeCommand('echo "Hello world"');
// 	window.onDidEndTerminalShellExecution(event => {
// 	if (event.execution === execution) {
// 		console.log(`Command exited with code ${event.exitCode}`);
// 	}
// 	});
// }
// }));
// // Fallback to sendText if there is no shell integration within 3 seconds of launching
// setTimeout(() => {
// if (!myTerm.shellIntegration) {
// 	myTerm.sendText('echo "Hello world"');
// 	// Without shell integration, we can't know when the command has finished or what the
// 	// exit code was.
// }
// }, 3000);
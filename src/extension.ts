// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

//Other Imports
import { readFileSync } from 'fs';
import { tmpdir } from "os";
import * as assert from 'assert';



// This method is called when your extension is activated (This is the entry point to the extension)
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated 
	// (your extension will be activated ONLY ONCE per instance)
	//Uncomment the following line for debugging
	//console.log('Congratulations, your extension "rustup-reminder" is now active!');

	// You can define the following command in the package.json file
	// by readding the following to contributes:     
	// "commands": [
    //   {
    //     "command": "rustup-reminder.helloWorld",
    //     "title": "Hello World"
    //   }
    // ],
	// The commandId parameter must match the command field in package.json
	// This command is empty on purpose. It exists so that we can test the extension by running it.	
	//Uncomment the following line for debugging
	//context.subscriptions.push(vscode.commands.registerCommand('rustup-reminder.helloWorld', () => {}));
	

	//Run the extension logic.
	//Doing things this way means we can automatically test the whole extension even if we update the
	//contents of the run function!
	run();
	
}


/**
 * Runs RustUp Reminder
 */
export function run() {

	const terminal = vscode.window.createTerminal({
		name: `Ext Terminal rustup-reminder`,
		hideFromUser: true
	});

	//Changes the terminal to be powershell (if it was already powershell, this does nothing)
	terminal.sendText("powershell");
	sleep(1000);//We have to wait for the shell to change. Otherwise our following commands won't be executed

	const TempDir = tmpdir();
	
	let FilePath ='';
	//We need different filepaths depending if we are on Windows or not
	if (process.platform === 'win32') //Note process.platform returns 'win32' even on 64-bit Windows systems
	{
		FilePath= `${TempDir}\\RustUpReminderTempOutput.txt`;
	}
	else
	{
	 	FilePath= `${TempDir}/RustUpReminderTempOutput.txt`;
	}

	//Writing rustup check output to a file is the only way we can retrieve it later
	const write_command = `rustup check | Out-File -FilePath ${FilePath} -Encoding utf8`; 
	terminal.sendText(write_command, true);

	//Note that without shell integration, we can't know when a command has finished execution. 
	//And shell intergration is not a given.
	//By appending a timestamped 'finished execution' message to the file we can verify the latest rustup check command has finished execution.
	const timestamp = Date.now();
	const finished_execution_command = `echo '\nRustUpReminder rustup check command finished ${timestamp}' | Out-File -FilePath ${FilePath} -Encoding utf8 -Append`;
	terminal.sendText(finished_execution_command, true);

	//CRITICAL: Note that we *MUST* wait here. If we do not, since using terminal.sendText doesn't wait
	//for the execution of the commands to finish, we might read the file before it even exits or is updated as
	//part of this run.
	//On my machine the minimum wait needed is about 700 miliseconds, so I set this conservatively for 1 second
	sleep(1000);

	//We open the file		
	const result = readFileSync(FilePath, { encoding: 'utf8', flag: 'r' }).trim(); //Note the trim here is important.
	let result_array = result.split('\n'); //Note this doesn't impact result (result will still be the full file contents)

	let no_error = true; //if there are (certain) errors during execution, then we want to output a different message to the user
	let errors = "";//details the errors we encounterd that we want to surface to the user.
	let update_available = false;

	//See if the last line is the finished execution message. 
	//This way we know there was no data race in the writes to file and the commands finished properly.
	if (`RustUpReminder rustup check command finished ${timestamp}` === result_array.pop())
	{
		//Note: We are checking for the output we expect based on the following file (see these specific tests for reference):
		//https://github.com/rust-lang/rustup/blob/708ffd6aeaa84d291d2a16cfd99bb45ae7e1e575/tests/suite/cli_exact.rs#L160 ,
		//https://github.com/rust-lang/rustup/blob/708ffd6aeaa84d291d2a16cfd99bb45ae7e1e575/tests/suite/cli_exact.rs#L179.
		
		const stable_arr = result_array.filter( (line: string) => {return line.startsWith("stable");} );
		if (stable_arr.length === 1) //There should be exactly one line that begins with stable
		{
			update_available = stable_arr[0].includes("Update available");

			if(!update_available && !(stable_arr[0].includes("Up to date")) )
			{
				no_error = false;
				errors = "The precise output formatting of rustup check appears to have changed";
			}
		}
		else
		{
			no_error = false;
			errors = `Could not find or single out the line that details whether the stable version of Rust is up to date or not in:\n${result}`;
		}	
	}
	else
	{
		no_error = false;
		errors = `Expected the following to end with "RustUpReminder rustup check command finished ${timestamp}" but instead got:\n${result}`;
	}

	//At this point we know if there is an update available to the stable version of Rust or not and whether we encountered any errors.

	//We get the values the user set for the extension settings (they are bools)
	const settings = vscode.workspace.getConfiguration();
	const setting_notify_up_to_date = settings.get('rustup-reminder.NotifyWhenUpToDate');
	const setting_update_when_possible = settings.get('rustup-reminder.UpdateWhenPossible');

	let dispose_of_terminal = true;

	if (no_error) // if we did not encounter errors
	{
		if (update_available && setting_update_when_possible)
		{
			//show update is available and starting update message (update Rust for them)
			vscode.window.showInformationMessage('An update to Rust stable is available! Updating now!');

			//We do not want the user to see the previous terminal commands
			terminal.sendText('clear', true);

			//Update stable Rust and potentially rustup itself.
			terminal.sendText('rustup update -- stable', true);
			
			//We want the user to see the update process is happening. 
			//That way they can see when the update finishes and handle any potential erros that arise from rustup themselves.
			terminal.show();

			//If we are updating stable Rust, then we want the terminal to persist
			dispose_of_terminal = false;
			
		}
		else if (update_available && !setting_update_when_possible)
		{
			//Notify the user there is an update available (and do NOT update Rust for them)
			vscode.window.showInformationMessage('An update to Rust stable is available!');
		}
		else //Note this happens iff update_available = false
		{
			if (setting_notify_up_to_date)
			{
				//Notify the user their stable Rust version is up to date
				vscode.window.showInformationMessage('Rust stable is up to date!');
			}
		}
	}
	else
	{
		//Report to the user we encoutered errors and detail them
		const error_msg = `Error running RustUp Reminder:\n${errors}`;
		vscode.window.showErrorMessage(error_msg);
	}


	if (dispose_of_terminal)
	{
		terminal.dispose(); //clean up the terminal
	}
	
}

/**
 * blocks for wait_time in miliseconds
 */
function sleep(wait_time: number) {

	wait_time = wait_time * 10 * 10; //TO DO-- change this.  Temp test to see if this makes all CI tests pass

	const intial_timestamp = Date.now();
	let current_time = Date.now();
	while ( (current_time- intial_timestamp ) < wait_time)
	{
		current_time = Date.now();
	}

}


// This method is called when your extension is deactivated
export function deactivate() {}


//For debugging purposes only (it is also used in a CI test)
export function run_debug()
{

	const terminal = vscode.window.createTerminal({
		name: `TEST2 Terminal rustup-reminder`,
		hideFromUser: true
	});

	//terminal.show(); //Uncomment for Debugging
	
	//Changes the terminal to be powershell (if it was already powershell, this does nothing)
	terminal.sendText("powershell");
	
	sleep(1000);//We have to wait for the shell to change


	const TempDir = tmpdir();

		
	let FilePath ='';
	
	//We need different filepaths depending if we are on Windows or not
	if (process.platform === 'win32') //Note process.platform returns 'win32' even on 64-bit Windows systems
	{
		//TEST MODIFICATION
		//Note I think these CI tests might be executed in parallel so we need a file for ea
		FilePath= `${TempDir}\\TestRustUpReminderTempOutput.txt`;
	}
	else
	{
		//TEST MODIFICATION
		//Note I think these CI tests might be executed in parallel so we need a file for each
	 	FilePath= `${TempDir}/TestRustUpReminderTempOutput.txt`;
	}
	
	console.log(`This platform is ${process.platform}`);


	const command = `echo 'the path to the temp file is ${FilePath}'`;
	console.log(command);

	const write_command = `rustup check | Out-File -FilePath ${FilePath} -Encoding utf8`;
	terminal.sendText(write_command, true);
	const timestamp = Date.now();
	const finished_execution_command = `echo '\nRustUpReminder rustup check command finished ${timestamp}' | Out-File -FilePath ${FilePath} -Encoding utf8 -Append`;
	console.log(finished_execution_command);
	terminal.sendText(finished_execution_command, true);
	

	//CRITICAL: Note that we *MUST* wait here. If we do not, since using sendText to the terminal doesn't wait
	//for the execution of the commands to finish, we might read the file before it even exits or is updated as
	//part of this run.
	//On my machine the minimum wait needed is about 700 miliseconds, so I set this conservatively for 1 second
	sleep(1000);


	//We open the file		
	const result = readFileSync(FilePath, { encoding: 'utf8', flag: 'r' }).trim(); //Note the trim here is important.
	console.log(`the file contents are \n${result}`);
	let result_array = result.split('\n'); //Note this doesn't impact result (result will still be the full file contents)

	let no_error = true; //if there is an error during execution, then we want to output a different message to the user
	let errors = "";//details the errors we encounterd that we want to surface to the user.
	let update_available = false;

	//See if the last line is the finished execution message. 
	//This way we know there was no data race in the writes to file and the commands finished properly.
	if (`RustUpReminder rustup check command finished ${timestamp}` === result_array.pop())
	{
		//Note: We are checking for the output we expect based on the following file (see these specific tests for reference):
		//https://github.com/rust-lang/rustup/blob/708ffd6aeaa84d291d2a16cfd99bb45ae7e1e575/tests/suite/cli_exact.rs#L160 ,
		//https://github.com/rust-lang/rustup/blob/708ffd6aeaa84d291d2a16cfd99bb45ae7e1e575/tests/suite/cli_exact.rs#L179.
		
		const stable_arr = result_array.filter( (line: string) => {return line.startsWith("stable");} );
		console.log(`Identifed the last line correctly and stable_arr is ${stable_arr}`);
		if (stable_arr.length === 1) //There should be exactly one line that begins with stable
		{
			console.log("Got here: found exactly one line detailing stable");
			update_available = stable_arr[0].includes("Update available");

			if(!update_available && !(stable_arr[0].includes("Up to date")) )
			{
				no_error = false;
				errors = "The precise output formatting of rustup check appears to have changed";
			}
		}
		else
		{
			no_error = false;
			errors = `Could not find or single out the line that details whether the stable version of Rust is up to date or not in:\n${result}`;
		}	
	}
	else
	{
		no_error = false;
		errors = `Expected the following to end with "RustUpReminder rustup check command finished ${timestamp}" but instead got:\n${result}`;
	}

	//TEST ASSERTION ADDED
	assert.strictEqual(no_error, true, `no_errors was false. erros is ${errors}`);

	//We get the values the user set for the extension settings
	const settings = vscode.workspace.getConfiguration();
	const setting_notify_up_to_date = settings.get('rustup-reminder.NotifyWhenUpToDate');
	const setting_update_when_possible = settings.get('rustup-reminder.UpdateWhenPossible');

	//TEST ASSERTIONS ADDED
	assert.strictEqual(typeof setting_notify_up_to_date, "boolean", 'setting_notify_up_to_date was not recognized as a bool');
	assert.strictEqual(typeof setting_update_when_possible, "boolean", 'setting_update_when_possible was not recognized as a bool');

	let dispose_of_terminal = true;

	if (no_error) // if we did not encounter errors
	{
		if (update_available && setting_update_when_possible)
		{
			//show update is available and starting update message (update Rust for them)
			vscode.window.showInformationMessage('An update to Rust stable is available! Updating now!');

			//We do not want the user to see the previous terminal commands
			terminal.sendText('clear', true);

			//Update stable Rust and potentially rustup itself.
			terminal.sendText('rustup update -- stable', true);
			
			//We want the user to see the update process is happening. 
			//That way they can see when the update finishes and handle any potential erros that arise from rustup themselves.
			terminal.show(); 

			//If we are updating stable Rust, then we want the terminal to persist
			dispose_of_terminal = false;

		}
		else if (update_available && !setting_update_when_possible)
		{
			//Notify the user there is an update available (and do NOT update Rust for them)
			vscode.window.showInformationMessage('An update to Rust stable is available!');
		}
		else //Note this happens iff update_available = false
		{
			if (setting_notify_up_to_date)
			{
				//Notify the user their stable Rust version is up to date
				vscode.window.showInformationMessage('Rust stable is up to date!');
			}
		}
	}
	else
	{
		//Report to the user we encoutered errors and detail them
		const error_msg = `Error running RustUp Reminder:\n${errors}`;
		vscode.window.showErrorMessage(error_msg);
	}
	

	if (dispose_of_terminal)
	{
		terminal.dispose(); //clean up the terminal-- comment out for debugging
	}

}
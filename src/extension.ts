// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

//Other Imports
import { execSync } from 'child_process';
import * as assert from 'assert';


// This method is called when your extension is activated (This is the entry point to the extension)
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated 
	// (your extension will be activated ONLY ONCE per instance)
	//Uncomment the following line for debugging
	//console.log('Congratulations, your extension "rustup-reminder" is now active!');

	
	//Run the extension logic.
	//Doing things this way means we can automatically test the whole extension even if we update the
	//contents of the run function!
	run();
	
}


/**
 * Runs RustUp Reminder
 */
export function run() {

	//run rustup check and get the output as a string
	const result = execSync('rustup check', {encoding: 'utf-8', windowsHide: true} ).trim();
	let result_array = result.split('\n'); //Note this doesn't impact result

	let no_error = true; //if there are (certain) errors during execution, then we want to output a different message to the user
	let errors = "";//details the errors we encounterd that we want to surface to the user.
	let update_available = false;


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
	

	//At this point we know if there is an update available to the stable version of Rust or not and whether we encountered any errors.

	//We get the values the user set for the extension settings (they are bools)
	const settings = vscode.workspace.getConfiguration();
	const setting_notify_up_to_date = settings.get('rustup-reminder.NotifyWhenUpToDate');
	const setting_update_when_possible = settings.get('rustup-reminder.UpdateWhenPossible');

	if (no_error) // if we did not encounter errors
	{
		if (update_available && setting_update_when_possible)
		{
			//show update is available and starting update message (update Rust for them)
			vscode.window.showInformationMessage('An update to Rust stable is available! Updating now!');

			//We want the user to see the update process happening in a VS code terminal. 
			//That way they can see when the update finishes and handle any potential errors that arise from rustup themselves.
			const terminal = vscode.window.createTerminal({
				name: `Ext Terminal rustup-reminder`,
				hideFromUser: true
			});

			//Update stable Rust and potentially rustup itself.
			terminal.sendText('rustup update -- stable', true);
			terminal.show();

			//If we are updating stable Rust, then we want the terminal to persist. 
			//We therefore do not run terminal.dispose() for cleanup.
			
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
	
}


// This method is called when your extension is deactivated
export function deactivate() {}


//For debugging purposes only (it is also used in a CI test)
export function run_debug()
{
	console.log(`This platform is ${process.platform}`);

	//run rustup check and get the output as a string
	const result = execSync('rustup check', {encoding: 'utf-8', windowsHide: true} ).trim();
	console.log(`the results of execsync are: \n${result}`);
	let result_array = result.split('\n'); //Note this doesn't impact result (result will still be the full file contents)

	let no_error = true; //if there is an error during execution, then we want to output a different message to the user
	let errors = "";//details the errors we encounterd that we want to surface to the user.
	let update_available = false;

	//Note: We are checking for the output we expect based on the following file (see these specific tests for reference):
	//https://github.com/rust-lang/rustup/blob/708ffd6aeaa84d291d2a16cfd99bb45ae7e1e575/tests/suite/cli_exact.rs#L160 ,
	//https://github.com/rust-lang/rustup/blob/708ffd6aeaa84d291d2a16cfd99bb45ae7e1e575/tests/suite/cli_exact.rs#L179.
	
	//TEST MODIFICATION
	//Since some of the GitHub CI tests install an *outdated* version of rust on purpose,
	//that outdated version will be uniquely called something like 1.81-x86_64-pc-windows-msvc
	//As opposed to stable-x86_64-pc-windows-msvc. 
	//We account for that here in the run_debug function only.
	const stable_arr = result_array.filter( 
		(line: string) => {
		return ( line.startsWith("stable") || line.includes("1.81.0 (eeb90cda1 2024-09-04)") ) ;} 
	);
	console.log(`stable_arr is ${stable_arr}`);
	if (stable_arr.length === 1) //There should be exactly one line that begins with stable
	{
		console.log("Got here: found exactly one line detailing stable");
		
		//TEST MODIFICATION
		//Make GitHub CI tests trigger update
		//We need this because rustup check reports outdated versions of rust that we installed on purpose
		//like 1.81-x86_64-pc-windows-msvc as up to date.
		update_available = stable_arr[0].includes("Update available") || 
		stable_arr[0].includes("1.81.0 (eeb90cda1 2024-09-04)");

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
	

	//TEST ASSERTION ADDED
	assert.strictEqual(no_error, true, `no_errors was false. erros is ${errors}`);

	//We get the values the user set for the extension settings
	const settings = vscode.workspace.getConfiguration();
	const setting_notify_up_to_date = settings.get('rustup-reminder.NotifyWhenUpToDate');
	let setting_update_when_possible = settings.get('rustup-reminder.UpdateWhenPossible');

	//TEST ASSERTIONS ADDED
	assert.strictEqual(typeof setting_notify_up_to_date, "boolean", 'setting_notify_up_to_date was not recognized as a bool');
	assert.strictEqual(typeof setting_update_when_possible, "boolean", 'setting_update_when_possible was not recognized as a bool');
	
	//TEST MODIFICATION
	//Setting this to true enables us to test that outdated rust versions do in-fact get updated in the GitHub CI tests
	setting_update_when_possible = true;

	if (no_error) // if we did not encounter errors
	{
		if (update_available && setting_update_when_possible)
		{
			//show update is available and starting update message (update Rust for them)
			vscode.window.showInformationMessage('An update to Rust stable is available! Updating now!');

			const terminal = vscode.window.createTerminal({
				name: `TEST2 Terminal rustup-reminder`,
				hideFromUser: true
			});

			//Update stable Rust and potentially rustup itself.
			terminal.sendText('rustup update -- stable', true);
			
			//We want the user to see the update process is happening. 
			//That way they can see when the update finishes and handle any potential erros that arise from rustup themselves.
			terminal.show(); 

			console.log("Installing update to stable rust");

			//If we are updating stable Rust, then we want the terminal to persist. 
			//We therefore do not run terminal.dispose() for cleanup.

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

}
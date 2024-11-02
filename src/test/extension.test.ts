import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import {run} from './../extension';

//relevant imports from the extension
import { readFileSync } from 'fs';
import { tmpdir } from "os";

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	suiteTeardown(() => {
		vscode.window.showInformationMessage('All tests done!');
	  });

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});

	//If this test fails (uncaught exception), that means the extension can't be run on the tested platform
	test('Create Terminal', () => {

		const terminal = vscode.window.createTerminal({
			name: `TEST1 Terminal rustup-reminder`,
			hideFromUser: true
		});
		
		terminal.show();
	
		terminal.sendText("echo 'Sent text immediately after creating'", true);
		terminal.dispose();
	});

	//This test will automatically test the entire logic of the extension even when that logic is updated
	test('Whole Extension', ()=> {
		run();
	});


	test('Whole Extension with addtional asserts', ()=> {

		const terminal = vscode.window.createTerminal({
			name: `TEST2 Terminal rustup-reminder`,
			hideFromUser: true
		});
		
		const TempDir = tmpdir();
		const FilePath= `${TempDir}\\RustUpReminderTempOutput.txt`;
		const command = `echo 'the path to the temp file is ${FilePath}'`;
		console.log(command);

		const write_command = `rustup check | Out-File -FilePath ${FilePath} -Encoding utf8`;
		terminal.sendText(write_command, true);
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
			
			const stable_arr = result_array.filter( (line: string) => {return line.startsWith("stable");} );
			console.log(`Identifed the last line correctly and stable_arr is ${stable_arr}`);
			if (stable_arr.length === 1) //There should be exactly one line that begins with stable
			{
				console.log("Got here");
				update_available = stable_arr[0].includes("Update available");
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
			errors = `Expected the following to end with "RustUpReminder rustup check command finished" but instead got:\n${result}`;
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
		
		//Now we are done with the terminal-- get rid of it.
		terminal.dispose(); //clean up the terminal-- comment out for debugging
	});

});

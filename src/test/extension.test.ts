import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import {run, run_debug} from './../extension';
import { promisify } from 'node:util';
// eslint-disable-next-line @typescript-eslint/naming-convention
import child_process from 'node:child_process';


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

	//If this test fails (uncaught exception), that means the extension can't be run on the tested platform
	test('Create subprocess', async () => {
		 
		const exec = promisify(child_process.exec);
		const result = (await exec('echo hello', {encoding: 'utf-8', windowsHide: true} )).stdout.trim();
		assert.strictEqual(result, "hello");

	});

	//This test will automatically test the entire logic of the extension even when that logic is updated
	test('Whole Extension', ()=> {

		run();

	});


	test('Whole Extension with addtional asserts and logs', async ()=> {

		//We must await here.
		await run_debug();

		//Note since run_debug() potentially returns when stable rust is starting to update
		//We need to wait here for rust to update so that all the GitHub CI tests pass
		function wait_finish_upate(wait_time: number) {
			const intial_timestamp = Date.now();
			let current_time = Date.now();
			while ( (current_time- intial_timestamp ) < wait_time)
			{
				current_time = Date.now();
			}

		}
		wait_finish_upate(1000 * 30); // wait 30 seconds

	});

});

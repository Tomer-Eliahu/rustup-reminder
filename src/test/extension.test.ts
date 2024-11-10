import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import {run, run_debug} from './../extension';

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

		//CI min wait time for tests to pass is 9_000 miliseconds (used to be 5_000)
		const ci_min_wait = 9_000;

		/**
		 * blocks for ci_min_wait in miliseconds
		 */
		function sleep() {
			const intial_timestamp = Date.now();
			let current_time = Date.now();
			while ( (current_time- intial_timestamp ) < ci_min_wait)
			{
				current_time = Date.now();
			}
	
		}
	
		run(sleep);
	});


	test('Whole Extension with addtional asserts and logs', ()=> {
		
		let setting_wait_time = vscode.workspace.getConfiguration().get('rustup-reminder.Delay');
		assert.strictEqual(typeof setting_wait_time, "number", 'setting_wait_time was not recognized as a number');

		//CI min wait time for tests to pass is 9_000 miliseconds (used to be 5000)
		const ci_min_wait = 9_000;
		console.log(`CI: setting wait time is set to ${setting_wait_time}. Actual wait time used is ${ci_min_wait}`);

		/**
		 * blocks for ci_min_wait in miliseconds
		 */
		function sleep() {
			const intial_timestamp = Date.now();
			let current_time = Date.now();
			while ( (current_time- intial_timestamp ) < ci_min_wait)
			{
				current_time = Date.now();
			}

		}

		run_debug(sleep);

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

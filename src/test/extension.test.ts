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
		run();
	});


	test('Whole Extension with addtional asserts and logs', ()=> {
		run_debug();
	});

});

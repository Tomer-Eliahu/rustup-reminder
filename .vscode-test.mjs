import { defineConfig } from '@vscode/test-cli';

export default defineConfig([
	{
		files: 'out/test/**/*.test.js',
		mocha: {
			timeout: 2_000_000 //changed default
		}
	}
	]);

//See https://code.visualstudio.com/api/working-with-extensions/testing-extension for how to define only certain
//tests to run (i.e. pass a label to vscode-test).
//So create a new file for CI tests and add a config to this file (and modfiy this existing config to only non-CI tests)
//Then edit package.json to create 2 different vscode-test commands and finally edit the CI yaml file to only run CI tests.
//Update: It turns out I don't need separate CI and non-CI tests.
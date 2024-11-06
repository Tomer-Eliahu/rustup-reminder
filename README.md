# RustUp Reminder

RustUp Reminder lets you know when there is an update available to the stable version of Rust. 

It is essentially a wrapper that runs 'rustup check' for you. You can also configure RustUp Reminder to auto-update Rust stable.
Select your desired behavior by using the extension settings.

Runs once you first open a Rust file in a given VS code instance. Opening additional files in the same VS code instance will *not* cause the extension to run again.

## Disclaimer

This is a third-party extension. It is *not* a part of rustup or associated with rustup.

## Requirements

1. Requires rustup to be installed.
2. Requires PowerShell to be installed.

## Extension Settings

This extension contributes the following settings:

* `rustup-reminder.NotifyWhenUpToDate`: Whether to *also* notify you if your stable Rust version is up to date. The default is to only notify you if there is an update available.

* `rustup-reminder.UpdateWhenPossible`: Whether to automatically update your stable Rust version when an update is available. This is done by running 'rustup update -- stable' (updates the stable version and potentially rustup itself). The default is to not auto-update.

* `rustup-reminder.Delay`: Delay in milliseconds after running terminal commands. This is necessary due to technical reasons. Default is 5000. See the Performance Tuning section below to learn more.

## Known Issues and Performance Tuning

If the extension fails, you might need to set your default terminal profile to PowerShell. You can do this by running the VS code command **Terminal: Select Default Profile** or by changing the appropriate setting from the list below:
* `terminal.integrated.defaultProfile.linux`

* `terminal.integrated.defaultProfile.osx`

* `terminal.integrated.defaultProfile.windows`

### Performance Tuning

If the extension still fails or if it works fine but you want it to be *as fast as possible* you can adjust the `rustup-reminder.Delay` setting. The extension should roughly take 3 times that value to run. You can inspect the code on GitHub to see why this is needed.

Follow the following steps:
1. Set `rustup-reminder.NotifyWhenUpToDate` to on (just for now).

2. Close and Reopen VS code. Then open a Rust file.

3. If you see a non-error notification, then you are good to go!

While the extension fails, increase the value.

If you want to speed up the extension, lower the value until (just before) the extension fails.

## Release Notes

### 1.0.0

Initial release of RustUp Reminder.

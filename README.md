# RustUp Reminder

RustUp Reminder lets you know when there is an update available to the stable version of Rust. 

It is essentially a wrapper that runs 'rustup check' for you. You can also configure RustUp Reminder to auto-update Rust stable.
Select your desired behavior by using the extension settings.

Runs once you first open a Rust file in a given VS code instance. Opening additional files in the same VS code instance will *not* cause the extension to run again.

## Disclaimer

This is a third-party extension. It is *not* a part of rustup or associated with rustup.

## Requirements

Requires rustup to be installed.

## Extension Settings

This extension contributes the following settings:

* `rustup-reminder.NotifyWhenUpToDate`: Whether to *also* notify you if your stable Rust version is up to date. The default is to only notify you if there is an update available.

* `rustup-reminder.UpdateWhenPossible`: Whether to automatically update your stable Rust version when an update is available. This is done by running 'rustup update -- stable' (updates the stable version and potentially rustup itself). The default is to not auto-update.

## Release Notes

### 1.0.0

Initial release of RustUp Reminder.

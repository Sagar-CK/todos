# Continue on another Mac

The personal handoff ZIP is a ready-to-open source project, not an installable iPhone app. Transfer it privately with AirDrop or your preferred file transfer. It includes generated Xcode files and the embedded UI, so Node and XcodeGen are not needed just to run this snapshot. Open `START-HERE.md` in the ZIP for its configured identifiers.

## Install the app and widget

1. Unzip the handoff and open `native/ios/Todos.xcodeproj` in Xcode with iOS support installed.
2. Sign in under **Xcode → Settings → Accounts**. Choose your development team for **both Todos and TodosWidget** in **Signing & Capabilities**. Leave automatic signing on.
3. Keep the generated bundle IDs, shared App Group, and shared Keychain group. Xcode must provision both targets with those capabilities. If a Personal Team rejects the App Group, use an Apple Developer Program team; do not remove the capability to get past signing, because the widget needs shared storage.
4. Connect and trust the iPhone. Enable Developer Mode when requested. Select the phone as the destination and **Todos** as the scheme, then Run.
5. Sign in to the same email on Mac and phone. Open each magic link on the device that requested it.
6. On the iPhone Home Screen, long-press, choose **Edit → Add Widget**, search **Todos**, and add the desired size.

The initial sign-in is required; sync afterward is automatic. The widget’s background refresh timing is controlled by iOS, so an idle widget may update later than the open app.

## Verify on the phone before publishing

- Add a todo on Mac and check that it appears in the phone app; make an edit on the phone and check the Mac.
- Check a widget checkbox and confirm that the same todo completes in both apps.
- Turn networking off, edit in the app, reconnect, and confirm the changes synchronize.
- Check small, medium, and large widgets, long text, light/dark appearance, and accent color.
- Confirm magic-link handoff and that the session survives app termination.
- Capture actual phone and widget screenshots, then style them in CleanShot using `docs/SCREENSHOTS.md`.

## Make a phone download available

An unsigned IPA or GitHub ZIP cannot install this app on an iPhone. For a convenient download, archive the **Todos** scheme for a generic iOS device, then use Xcode Organizer to distribute through **App Store Connect → TestFlight**. This requires an Apple Developer Program membership and a valid signing team. Complete the App Store Connect app record, export-compliance answers, beta details, and any Apple review required for the selected tester group. After processing, use the actual TestFlight invitation in the GitHub release.

Apple documents [device signing and membership](https://developer.apple.com/help/account/basics/about-your-developer-account), [supported iOS capabilities](https://developer.apple.com/help/account/reference/supported-capabilities-ios), and [TestFlight distribution](https://developer.apple.com/documentation/xcode/distributing-your-app-for-beta-testing-and-releases).

For further changes, clone the repository on the other Mac, copy your private `.env.local` into it, then run `npm ci` and `npm run ios:prepare`. Set `TODOS_DEVELOPMENT_TEAM` in `.env.local` if you want the team preserved when regenerating the project. Keep personal ZIPs, generated client bundles, and `.env.local` off GitHub.

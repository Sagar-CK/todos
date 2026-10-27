import AppKit
import WebKit
import ApplicationServices
import Carbon

final class TodoPanel: NSPanel {
    override var canBecomeKey: Bool { true }
    override var canBecomeMain: Bool { true }
}

final class TodoChromeView: NSView {
    var onClose: (() -> Void)?
    var onAccent: (() -> Void)?
    private var hoverArea: NSTrackingArea?
    private lazy var closeButton = makeButton("xmark", label: "Close Todos", action: #selector(closePanel))
    private lazy var colorButton = makeButton("paintpalette", label: "Accent color", action: #selector(openAccent))
    override init(frame: NSRect) {
        super.init(frame: frame)
        addSubview(closeButton); addSubview(colorButton)
        showControls(false)
    }
    required init?(coder: NSCoder) { fatalError("init(coder:) is not supported") }
    private func makeButton(_ symbol: String, label: String, action: Selector) -> NSButton {
        let button = NSButton(image: NSImage(systemSymbolName: symbol, accessibilityDescription: label)!, target: self, action: action)
        button.isBordered = false; button.contentTintColor = .secondaryLabelColor
        button.toolTip = label; button.setAccessibilityLabel(label)
        return button
    }
    override func layout() {
        super.layout()
        closeButton.frame = NSRect(x: 12, y: 12, width: 20, height: 20)
        colorButton.frame = NSRect(x: bounds.width - 32, y: 12, width: 20, height: 20)
    }
    override func updateTrackingAreas() {
        super.updateTrackingAreas()
        if let hoverArea { removeTrackingArea(hoverArea) }
        let area = NSTrackingArea(rect: bounds, options: [.mouseEnteredAndExited, .activeAlways, .inVisibleRect], owner: self)
        addTrackingArea(area); hoverArea = area
    }
    private func showControls(_ visible: Bool) { closeButton.isHidden = !visible; colorButton.isHidden = !visible }
    override func mouseEntered(with event: NSEvent) { showControls(true) }
    override func mouseExited(with event: NSEvent) { showControls(false) }
    override func mouseDown(with event: NSEvent) { showControls(true); window?.performDrag(with: event) }
    override func acceptsFirstMouse(for event: NSEvent?) -> Bool { true }
    @objc private func closePanel() { onClose?() }
    @objc private func openAccent() { onAccent?() }
}

final class TodoContentView: NSView {
    let webView: WKWebView
    let chrome = TodoChromeView()
    init(webView: WKWebView) {
        self.webView = webView
        super.init(frame: .zero)
        addSubview(webView); addSubview(chrome)
    }
    required init?(coder: NSCoder) { fatalError("init(coder:) is not supported") }
    override func layout() {
        super.layout()
        webView.frame = bounds
        chrome.frame = NSRect(x: 0, y: bounds.height - 44, width: bounds.width, height: 44)
    }
}

final class AppDelegate: NSObject, NSApplicationDelegate, WKScriptMessageHandler, WKNavigationDelegate, NSWindowDelegate {
    private let isDemo = CommandLine.arguments.contains("--demo")
    private var panel: TodoPanel!
    private var webView: WKWebView!
    private var content: TodoContentView!
    private var status: NSStatusItem!
    private var shortcutItem: NSMenuItem!
    private let shortcut = DoubleTap()
    private var permissionTimer: Timer?
    private var pendingAuth: String?
    private var shortcutRequested = UserDefaults.standard.object(forKey: "DoubleTapEnabled") as? Bool ?? true
    private var shortcutState = "permission-required"
    private var activationCount = 0
    private var lastDiagnostic: Data?

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.accessory)
        let config = WKWebViewConfiguration()
        if isDemo {
            config.websiteDataStore = .nonPersistent()
            let demo = """
            window.__demo = true;
            const tasks = ['Pick up coffee beans', 'Book a table for Friday', 'Read a few pages', 'Go for a walk'].map((title, index) => ({id: crypto.randomUUID(), title, completed: index === 3, created_at: new Date(1700000000000 + index).toISOString(), deleted_at: null}));
            localStorage.setItem('sagar-todos:v1:local', JSON.stringify({tasks, pending: []}));
            """
            config.userContentController.addUserScript(WKUserScript(source: demo, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        }
        config.userContentController.add(self, name: "todos")
        config.userContentController.addUserScript(WKUserScript(source: "window.__nativePlatform = 'mac';", injectionTime: .atDocumentStart, forMainFrameOnly: true))
        if !isDemo, let data = SessionVault.readData(), let json = String(data: data, encoding: .utf8) {
            config.userContentController.addUserScript(WKUserScript(source: "window.__nativeSession = \(json);", injectionTime: .atDocumentStart, forMainFrameOnly: true))
        }
        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self
        webView.isInspectable = true
        panel = TodoPanel(contentRect: NSRect(x: 0, y: 0, width: 440, height: 500), styleMask: [.titled, .closable, .resizable, .fullSizeContentView], backing: .buffered, defer: false)
        panel.title = "Todos"; panel.titleVisibility = .hidden; panel.titlebarAppearsTransparent = true
        panel.standardWindowButton(.closeButton)?.isHidden = true
        panel.standardWindowButton(.miniaturizeButton)?.isHidden = true
        panel.standardWindowButton(.zoomButton)?.isHidden = true
        panel.isFloatingPanel = true; panel.hidesOnDeactivate = false; panel.level = .floating
        panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
        panel.minSize = NSSize(width: 320, height: 240)
        panel.isReleasedWhenClosed = false
        content = TodoContentView(webView: webView)
        content.chrome.onClose = { [weak self] in self?.closePanel() }
        content.chrome.onAccent = { [weak self] in self?.openAccent() }
        panel.contentView = content
        if isDemo {
            panel.appearance = NSAppearance(named: CommandLine.arguments.contains("--light") ? .aqua : .darkAqua)
            panel.setContentSize(NSSize(width: 440, height: 340)); panel.center()
        }
        else {
            if !panel.setFrameUsingName("TodosPanel") { panel.center() }
            panel.setFrameAutosaveName("TodosPanel")
        }
        panel.delegate = self
        status = NSStatusBar.system.statusItem(withLength: NSStatusItem.squareLength)
        status.button?.image = NSImage(systemSymbolName: "checklist", accessibilityDescription: "Todos")
        let menu = NSMenu()
        let show = NSMenuItem(title: "Open todos", action: #selector(toggle), keyEquivalent: ""); show.target = self; menu.addItem(show)
        let accent = NSMenuItem(title: "Accent color…", action: #selector(openAccent), keyEquivalent: ""); accent.target = self; menu.addItem(accent)
        let appearance = NSMenuItem(title: "Switch appearance", action: #selector(switchAppearance), keyEquivalent: ""); appearance.target = self; menu.addItem(appearance)
        if !isDemo && !BackendConfig.apiKey.isEmpty {
            let account = NSMenuItem(title: "Account…", action: #selector(openAccount), keyEquivalent: ""); account.target = self; menu.addItem(account)
        }
        shortcutItem = NSMenuItem(title: "Enable double-tap shortcut…", action: #selector(enableShortcut), keyEquivalent: ""); shortcutItem.target = self; menu.addItem(shortcutItem)
        menu.addItem(.separator())
        let quit = NSMenuItem(title: "Quit Todos", action: #selector(quitApp), keyEquivalent: "q"); quit.target = self; menu.addItem(quit)
        status.menu = menu
        // Use native clipboard commands and the checklist's two-stage selection.
        let main = NSMenu()
        let appItem = NSMenuItem(); let appMenu = NSMenu(title: "Todos")
        appMenu.addItem(accent.copy() as! NSMenuItem)
        appMenu.addItem(appearance.copy() as! NSMenuItem)
        if !isDemo && !BackendConfig.apiKey.isEmpty {
            let account = NSMenuItem(title: "Account…", action: #selector(openAccount), keyEquivalent: ""); account.target = self; appMenu.addItem(account)
        }
        appMenu.addItem(.separator())
        let mainQuit = NSMenuItem(title: "Quit Todos", action: #selector(quitApp), keyEquivalent: "q"); mainQuit.target = self; appMenu.addItem(mainQuit)
        appItem.submenu = appMenu; main.addItem(appItem)
        let fileItem = NSMenuItem(); let file = NSMenu(title: "File")
        let close = NSMenuItem(title: "Close", action: #selector(closePanel), keyEquivalent: "w"); close.target = self; file.addItem(close)
        fileItem.submenu = file; main.addItem(fileItem)
        let editItem = NSMenuItem(); let edit = NSMenu(title: "Edit")
        let undo = NSMenuItem(title: "Undo", action: #selector(undoAction), keyEquivalent: "z"); undo.target = self; edit.addItem(undo)
        edit.addItem(.separator())
        for (title, selector, key) in [("Cut", "cut:", "x"), ("Copy", "copy:", "c"), ("Paste", "paste:", "v")] {
            edit.addItem(withTitle: title, action: NSSelectorFromString(selector), keyEquivalent: key)
        }
        let selectAll = NSMenuItem(title: "Select all", action: #selector(selectAllAction), keyEquivalent: "a"); selectAll.target = self; edit.addItem(selectAll)
        editItem.submenu = edit; main.addItem(editItem); NSApp.mainMenu = main
        shortcut.onToggle = { [weak self] in
            guard let self else { return }
            self.activationCount += 1
            self.toggle()
            self.writeShortcutDiagnostic()
        }
        refreshShortcut()
        // Permission is commonly granted after launch. Keep listening for that
        // change without requiring the user to reopen or toggle the app.
        let timer = Timer(timeInterval: 2, repeats: true) { [weak self] _ in self?.refreshShortcut() }
        permissionTimer = timer
        RunLoop.main.add(timer, forMode: .common)
        if let file = Bundle.main.url(forResource: "native", withExtension: "html", subdirectory: "web") { webView.loadFileURL(file, allowingReadAccessTo: file.deletingLastPathComponent()) }
        showPanel()
    }
    private func showPanel() {
        NSApp.activate(ignoringOtherApps: true); panel.makeKeyAndOrderFront(nil)
        webView.evaluateJavaScript("window.dispatchEvent(new Event('todos-resume'))")
        writeShortcutDiagnostic()
    }
    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool { showPanel(); return true }
    @objc func toggle() { if panel.isVisible && panel.isKeyWindow { closePanel() } else { showPanel() } }
    @objc func closePanel() {
        if !isDemo { panel.saveFrame(usingName: "TodosPanel") }
        webView.evaluateJavaScript("window.dispatchEvent(new Event('todos-save-draft'))") { [weak self] _, _ in self?.panel.orderOut(nil); self?.writeShortcutDiagnostic() }
    }
    @objc func openAccent() { showPanel(); webView.evaluateJavaScript("window.dispatchEvent(new Event('todos-open-accent'))") }
    @objc func openAccount() { showPanel(); webView.evaluateJavaScript("window.dispatchEvent(new Event('todos-open-account'))") }
    @objc func switchAppearance() { webView.evaluateJavaScript("window.dispatchEvent(new Event('todos-switch-appearance'))") }
    @objc func undoAction() { webView.evaluateJavaScript("window.dispatchEvent(new Event('todos-undo'))") }
    @objc func selectAllAction() { webView.evaluateJavaScript("window.dispatchEvent(new Event('todos-select-all'))") }
    @objc func quitApp() {
        if !isDemo { panel.saveFrame(usingName: "TodosPanel") }
        webView.evaluateJavaScript("window.dispatchEvent(new Event('todos-save-draft'))") { [weak self] _, _ in self?.shortcut.stop(); NSApp.terminate(nil) }
    }
    func application(_ application: NSApplication, open urls: [URL]) {
        guard let url = urls.first, let json = AuthLink.tokens(from: url) else { return }
        pendingAuth = json
        if webView != nil { deliverAuth() }
        if panel != nil { showPanel() }
    }
    private func deliverAuth() {
        guard let json = pendingAuth else { return }
        webView.evaluateJavaScript("window.__nativeSession = \(json); window.dispatchEvent(new Event('todos-auth'))") { [weak self] _, error in
            if error == nil { self?.pendingAuth = nil }
        }
    }
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) { deliverAuth(); publishShortcutState() }
    private func refreshShortcut() {
        guard !isDemo else { return }
        let trusted = AXIsProcessTrusted()
        if !shortcutRequested || !trusted { shortcut.stop() }
        else if !shortcut.enabled { _ = shortcut.start() }
        let next = !shortcutRequested ? "disabled" : !trusted ? "permission-required" : shortcut.enabled ? "enabled" : "unavailable"
        let changed = next != shortcutState
        shortcutState = next
        shortcutItem.title = shortcutLabel()
        if changed { publishShortcutState() }
        writeShortcutDiagnostic()
    }
    private func shortcutLabel() -> String {
        switch shortcutState {
        case "enabled": return "Disable double-tap shortcut"
        case "permission-required": return "Allow shortcut in macOS…"
        case "unavailable": return "Retry double-tap shortcut"
        default: return "Enable double-tap shortcut"
        }
    }
    private func publishShortcutState() {
        webView.evaluateJavaScript("window.__shortcutState = '\(shortcutState)'; window.dispatchEvent(new CustomEvent('todos-shortcut-status', { detail: '\(shortcutState)' }))")
    }
    private func writeShortcutDiagnostic() {
        guard !isDemo else { return }
        // Only operational flags are recorded, never keystrokes, tasks or tokens.
        let snapshot: [String: Any] = ["accessibilityGranted": AXIsProcessTrusted(), "requested": shortcutRequested,
            "eventTapEnabled": shortcut.enabled, "state": shortcutState,
            "secureInput": IsSecureEventInputEnabled(), "activationCount": activationCount,
            "windowVisible": panel?.isVisible ?? false, "doubleTapInterval": shortcut.interval,
            "alwaysOnTop": panel?.level == .floating]
        guard let data = try? JSONSerialization.data(withJSONObject: snapshot, options: [.sortedKeys]), data != lastDiagnostic else { return }
        lastDiagnostic = data
        let folder = FileManager.default.homeDirectoryForCurrentUser.appendingPathComponent("Library/Logs/Todos", isDirectory: true)
        try? FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        try? data.write(to: folder.appendingPathComponent("shortcut.json"), options: .atomic)
    }
    @objc func enableShortcut() {
        guard !isDemo else { return }
        if shortcut.enabled {
            shortcutRequested = false; UserDefaults.standard.set(false, forKey: "DoubleTapEnabled")
            refreshShortcut(); return
        }
        shortcutRequested = true; UserDefaults.standard.set(true, forKey: "DoubleTapEnabled")
        refreshShortcut()
        if shortcut.enabled { return }
        let options = [kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String: true] as CFDictionary
        _ = AXIsProcessTrustedWithOptions(options)
        refreshShortcut()
        if shortcut.enabled { return }
        NSWorkspace.shared.open(URL(string: "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility")!)
    }
    func windowShouldClose(_ sender: NSWindow) -> Bool { closePanel(); return false }
    func windowDidMove(_ notification: Notification) { if !isDemo { panel.saveFrame(usingName: "TodosPanel") } }
    func windowDidResize(_ notification: Notification) { if !isDemo { panel.saveFrame(usingName: "TodosPanel") } }
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.frameInfo.isMainFrame, let body = message.body as? [String: Any], let type = body["type"] as? String else { return }
        switch type {
        case "hide": closePanel()
        case "modal": content.chrome.isHidden = body["open"] as? Bool ?? false
        case "shortcut": enableShortcut()
        case "session":
            guard !isDemo else { return }
            if let session = body["session"] as? [String: Any], let data = try? JSONSerialization.data(withJSONObject: session) { SessionVault.save(data) }
            else { SessionVault.clear() }
        default: break
        }
    }
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else { decisionHandler(.cancel); return }
        if url.isFileURL { decisionHandler(.allow) }
        else { if ["https", "http"].contains(url.scheme ?? "") { NSWorkspace.shared.open(url) }; decisionHandler(.cancel) }
    }
}

let application = NSApplication.shared
let delegate = AppDelegate()
application.delegate = delegate
application.run()

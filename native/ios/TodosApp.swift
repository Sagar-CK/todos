import SwiftUI
import WebKit
import WidgetKit

@main
struct TodosApp: App {
    @StateObject private var bridge = TodoBridge()
    @Environment(\.scenePhase) private var phase
    var body: some Scene {
        WindowGroup {
            TodoWebView(bridge: bridge)
                .ignoresSafeArea(.container, edges: [.top, .bottom])
                .onOpenURL { url in bridge.receive(url: url) }
                .onChange(of: phase) { _, value in if value == .active { bridge.resume() } }
        }
    }
}

final class TodoBridge: NSObject, ObservableObject, WKScriptMessageHandler, WKNavigationDelegate {
    weak var webView: WKWebView?
    private var pendingAuth: String?
    func receive(url: URL) {
        guard let json = AuthLink.tokens(from: url) else { return }
        pendingAuth = json; deliverAuth()
    }
    func deliverAuth() {
        guard let json = pendingAuth else { return }
        webView?.evaluateJavaScript("window.__nativeSession = \(json); window.dispatchEvent(new Event('todos-auth'))") { [weak self] _, error in
            if error == nil { self?.pendingAuth = nil }
        }
    }
    func resume() {
        var script = ""
        if let data = SessionVault.readData(), let json = String(data: data, encoding: .utf8) { script = "window.__nativeSession = \(json);" }
        webView?.evaluateJavaScript(script + "window.dispatchEvent(new Event('todos-resume'))")
    }
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) { deliverAuth(); resume() }
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.frameInfo.isMainFrame, let body = message.body as? [String: Any], let type = body["type"] as? String else { return }
        if type == "appearance" {
            if WidgetStore.setAccent(body["accent"] as? String) { WidgetCenter.shared.reloadAllTimelines() }
        } else if type == "session" {
            if let session = body["session"] as? [String: Any], let data = try? JSONSerialization.data(withJSONObject: session) {
                if !SessionVault.save(data) {
                    webView?.evaluateJavaScript("window.dispatchEvent(new CustomEvent('todos-native-error', {detail:'Couldn’t share sign-in with the widget. Check App Groups and Keychain signing in Xcode.'}))")
                }
            } else { SessionVault.clear(); WidgetStore.clear() }
            WidgetCenter.shared.reloadAllTimelines()
        } else if type == "tasks", let userId = body["userId"] as? String, let tasks = body["tasks"] as? [[String: Any]],
                  let data = try? JSONSerialization.data(withJSONObject: tasks), let decoded = try? JSONDecoder().decode([WidgetTodo].self, from: data) {
            WidgetStore.save(tasks: decoded, userId: userId)
            WidgetCenter.shared.reloadAllTimelines()
        }
    }
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else { decisionHandler(.cancel); return }
        if url.isFileURL { decisionHandler(.allow) }
        else { if ["https", "http"].contains(url.scheme ?? "") { UIApplication.shared.open(url) }; decisionHandler(.cancel) }
    }
}

struct TodoWebView: UIViewRepresentable {
    let bridge: TodoBridge
    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.userContentController.add(bridge, name: "todos")
        config.userContentController.addUserScript(WKUserScript(source: "window.__nativePlatform = 'ios';", injectionTime: .atDocumentStart, forMainFrameOnly: true))
        if let data = SessionVault.readData(), let json = String(data: data, encoding: .utf8) {
            config.userContentController.addUserScript(WKUserScript(source: "window.__nativeSession = \(json);", injectionTime: .atDocumentStart, forMainFrameOnly: true))
        }
        let view = WKWebView(frame: .zero, configuration: config)
        view.navigationDelegate = bridge; view.scrollView.contentInsetAdjustmentBehavior = .never
        bridge.webView = view
        if let url = Bundle.main.url(forResource: "native", withExtension: "html", subdirectory: "web") { view.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent()) }
        return view
    }
    func updateUIView(_ uiView: WKWebView, context: Context) {}
}

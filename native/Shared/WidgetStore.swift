import Foundation

struct WidgetTodo: Codable, Identifiable {
    var id: String
    var title: String
    var completed: Bool
    var created_at: String
    var deleted_at: String?
}

enum WidgetStore {
    private static var defaults: UserDefaults { UserDefaults(suiteName: BackendConfig.appGroup)! }
    static var accentRGB: UInt32? {
        guard let hex = defaults.string(forKey: "accent"), hex.count == 7, hex.first == "#" else { return nil }
        return UInt32(hex.dropFirst(), radix: 16)
    }
    @discardableResult static func setAccent(_ value: String?) -> Bool {
        if let value, value.range(of: "^#[0-9a-fA-F]{6}$", options: .regularExpression) == nil { return false }
        guard defaults.string(forKey: "accent") != value else { return false }
        defaults.set(value, forKey: "accent")
        return true
    }
    static func read() -> [WidgetTodo] {
        guard let session = SessionVault.read(), defaults.string(forKey: "userId") == session.user.id,
              let data = defaults.data(forKey: "tasks") else { return [] }
        return (try? JSONDecoder().decode([WidgetTodo].self, from: data)) ?? []
    }
    static func save(tasks: [WidgetTodo], userId: String) {
        guard let current = SessionVault.read(), current.user.id == userId else { return }
        defaults.set(userId, forKey: "userId")
        defaults.set(try? JSONEncoder().encode(tasks), forKey: "tasks")
    }
    static func clear() { defaults.removeObject(forKey: "tasks"); defaults.removeObject(forKey: "userId") }
    static var hasSession: Bool { SessionVault.read() != nil }
}

enum TodoAPIError: LocalizedError {
    case signedOut, requestFailed, sessionSaveFailed
    var errorDescription: String? {
        switch self {
        case .signedOut: return "Open Todos to sign in."
        case .requestFailed: return "Couldn’t sync. Open Todos to retry."
        case .sessionSaveFailed: return "Couldn’t save your session. Open Todos to sign in again."
        }
    }
}

actor WidgetAPI {
    static let shared = WidgetAPI()
    private func session() async throws -> TodoSession {
        guard var session = SessionVault.read() else { throw TodoAPIError.signedOut }
        if let expires = session.expires_at, expires > Date().timeIntervalSince1970 + 60 { return session }
        var request = URLRequest(url: BackendConfig.url.appendingPathComponent("auth/v1/token"))
        request.url = URL(string: request.url!.absoluteString + "?grant_type=refresh_token")
        request.httpMethod = "POST"; request.timeoutInterval = 15
        request.setValue(BackendConfig.apiKey, forHTTPHeaderField: "apikey")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: ["refresh_token": session.refresh_token])
        let (data, response) = try await URLSession.shared.data(for: request)
        guard (response as? HTTPURLResponse)?.statusCode == 200 else { throw TodoAPIError.signedOut }
        let refreshed = try JSONDecoder().decode(TodoSession.self, from: data)
        guard SessionVault.read()?.user.id == session.user.id else { throw TodoAPIError.signedOut }
        guard SessionVault.save(data) else { throw TodoAPIError.sessionSaveFailed }
        session = refreshed
        return session
    }
    private func request(method: String, query: [URLQueryItem], body: [String: Any]? = nil) async throws -> (Data, String) {
        let auth = try await session()
        var url = URLComponents(url: BackendConfig.url.appendingPathComponent("rest/v1/todos"), resolvingAgainstBaseURL: false)!
        url.queryItems = query + [URLQueryItem(name: "user_id", value: "eq.\(auth.user.id)")]
        var request = URLRequest(url: url.url!); request.httpMethod = method; request.timeoutInterval = 15
        request.setValue(BackendConfig.apiKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(auth.access_token)", forHTTPHeaderField: "Authorization")
        if let body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.setValue("return=representation", forHTTPHeaderField: "Prefer")
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
        }
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let status = (response as? HTTPURLResponse)?.statusCode, (200..<300).contains(status) else { throw TodoAPIError.requestFailed }
        guard SessionVault.read()?.user.id == auth.user.id else { throw TodoAPIError.signedOut }
        return (data, auth.user.id)
    }
    func fetch() async throws -> [WidgetTodo] {
        let (data, userId) = try await request(method: "GET", query: [URLQueryItem(name: "select", value: "id,title,completed,created_at,deleted_at"), URLQueryItem(name: "order", value: "created_at.asc,id.asc")])
        let tasks = try JSONDecoder().decode([WidgetTodo].self, from: data)
        WidgetStore.save(tasks: tasks, userId: userId)
        return tasks
    }
    func complete(id: String) async throws {
        // Idempotent target value: two taps cannot accidentally reopen the task.
        let (data, userId) = try await request(method: "PATCH", query: [URLQueryItem(name: "id", value: "eq.\(id)"), URLQueryItem(name: "deleted_at", value: "is.null")], body: ["completed": true])
        let updated = try JSONDecoder().decode([WidgetTodo].self, from: data)
        guard let task = updated.first else { throw TodoAPIError.requestFailed }
        var tasks = WidgetStore.read()
        if let index = tasks.firstIndex(where: { $0.id == id }) { tasks[index] = task }
        WidgetStore.save(tasks: tasks, userId: userId)
    }
}

import Foundation
import Security

struct TodoSession: Codable {
    struct User: Codable { let id: String; let email: String? }
    var access_token: String
    var refresh_token: String
    var expires_at: Double?
    var user: User
}

enum SessionVault {
    private static var query: [String: Any] {
        var value: [String: Any] = [kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: BackendConfig.bundleID, kSecAttrAccount as String: "supabase-session"]
        #if os(iOS)
        if let group = Bundle.main.object(forInfoDictionaryKey: "KeychainAccessGroup") as? String {
            value[kSecAttrAccessGroup as String] = group
        }
        #endif
        return value
    }
    static func readData() -> Data? {
        var value = query
        value[kSecReturnData as String] = true
        value[kSecMatchLimit as String] = kSecMatchLimitOne
        var item: CFTypeRef?
        guard SecItemCopyMatching(value as CFDictionary, &item) == errSecSuccess else { return nil }
        return item as? Data
    }
    static func read() -> TodoSession? {
        guard let data = readData() else { return nil }
        return try? JSONDecoder().decode(TodoSession.self, from: data)
    }
    @discardableResult static func save(_ data: Data) -> Bool {
        let attributes: [String: Any] = [kSecValueData as String: data, kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly]
        let status = SecItemUpdate(query as CFDictionary, attributes as CFDictionary)
        if status == errSecItemNotFound {
            return SecItemAdd(query.merging(attributes) { _, new in new } as CFDictionary, nil) == errSecSuccess
        }
        return status == errSecSuccess
    }
    static func clear() { SecItemDelete(query as CFDictionary) }
}

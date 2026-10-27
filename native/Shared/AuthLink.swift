import Foundation

enum AuthLink {
    static func tokens(from url: URL) -> String? {
        guard url.scheme == BackendConfig.urlScheme, url.host == "auth" else { return nil }
        var components = URLComponents()
        components.query = url.fragment ?? url.query
        let items = components.queryItems ?? []
        guard let access = items.first(where: { $0.name == "access_token" })?.value,
              let refresh = items.first(where: { $0.name == "refresh_token" })?.value else { return nil }
        let values = ["access_token": access, "refresh_token": refresh]
        guard let data = try? JSONSerialization.data(withJSONObject: values) else { return nil }
        return String(data: data, encoding: .utf8)
    }
}

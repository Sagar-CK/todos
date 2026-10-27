import SwiftUI
import WidgetKit
import AppIntents

struct CompleteTodo: AppIntent {
    static var title: LocalizedStringResource = "Complete task"
    static var openAppWhenRun = false
    @Parameter(title: "Task ID") var taskId: String
    init() {}
    init(taskId: String) { self.taskId = taskId }
    func perform() async throws -> some IntentResult {
        try await WidgetAPI.shared.complete(id: taskId)
        WidgetCenter.shared.reloadAllTimelines()
        return .result()
    }
}

struct TodoEntry: TimelineEntry {
    let date: Date
    let tasks: [WidgetTodo]
    let signedIn: Bool
    let failed: Bool
}

struct TodoProvider: TimelineProvider {
    func placeholder(in context: Context) -> TodoEntry { TodoEntry(date: Date(), tasks: [], signedIn: true, failed: false) }
    func getSnapshot(in context: Context, completion: @escaping (TodoEntry) -> Void) {
        completion(TodoEntry(date: Date(), tasks: WidgetStore.read(), signedIn: WidgetStore.hasSession, failed: false))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<TodoEntry>) -> Void) {
        Task {
            var tasks = WidgetStore.read(); var failed = false
            if WidgetStore.hasSession {
                do { tasks = try await WidgetAPI.shared.fetch() } catch { failed = true }
            }
            let entry = TodoEntry(date: Date(), tasks: tasks, signedIn: WidgetStore.hasSession, failed: failed)
            completion(Timeline(entries: [entry], policy: .after(Date().addingTimeInterval(15 * 60))))
        }
    }
}

struct TodoWidgetView: View {
    let entry: TodoEntry
    @Environment(\.widgetFamily) private var family
    @Environment(\.colorScheme) private var colorScheme
    private var open: [WidgetTodo] { entry.tasks.filter { !$0.completed && $0.deleted_at == nil } }
    var body: some View {
        VStack(alignment: .leading, spacing: TodoTheme.listGap) {
            if entry.failed { HStack { Spacer(); Image(systemName: "icloud.slash").foregroundStyle(.secondary).accessibilityLabel("Couldn’t sync") } }
            if !entry.signedIn {
                Link("Sign in", destination: URL(string: "\(BackendConfig.urlScheme)://open")!).font(.custom("Geist", size: TodoTheme.textSize))
            } else if open.isEmpty {
                Text("No tasks").font(.custom("Geist", size: TodoTheme.textSize)).foregroundStyle(.secondary)
            } else {
                ForEach(Array(open.prefix(family == .systemLarge ? 10 : 4))) { task in
                    Button(intent: CompleteTodo(taskId: task.id)) {
                        HStack(alignment: .firstTextBaseline, spacing: TodoTheme.rowGap) {
                            Image(systemName: "square").font(.system(size: TodoTheme.textSize, weight: .light))
                            Text(task.title).font(.custom("Geist", size: TodoTheme.textSize).weight(.light)).lineLimit(1)
                            Spacer(minLength: 0)
                        }.foregroundStyle(.primary)
                    }.buttonStyle(.plain).accessibilityLabel("Complete \(task.title)")
                }
            }
            Spacer(minLength: 0)
        }
        .containerBackground(colorScheme == .dark ? TodoTheme.darkCanvas : TodoTheme.lightCanvas, for: .widget)
        .widgetURL(URL(string: "\(BackendConfig.urlScheme)://open"))
    }
}

@main
struct TodosWidget: Widget {
    let kind = "TodosWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: TodoProvider()) { entry in TodoWidgetView(entry: entry) }
            .configurationDisplayName("Todos")
            .description("Your checklist")
            .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

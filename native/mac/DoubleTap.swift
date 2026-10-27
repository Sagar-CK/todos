import AppKit
import ApplicationServices

/// Defers the first unmodified backtick; replays it for ordinary typing.
/// A second press inside the interval consumes the pair and toggles the panel.
final class DoubleTap {
    private var tap: CFMachPort?
    private var source: CFRunLoopSource?
    private var buffered: [CGEvent] = []
    private var timer: Timer?
    private var firstReleased = false
    private var swallowRelease = false
    private let marker: Int64 = 0x544F444F
    let interval: TimeInterval = min(0.6, max(0.3, NSEvent.doubleClickInterval))
    var onToggle: (() -> Void)?
    var enabled: Bool { tap.map { CGEvent.tapIsEnabled(tap: $0) } ?? false }

    func start() -> Bool {
        if enabled { return true }
        guard AXIsProcessTrusted() else { return false }
        if let tap { CGEvent.tapEnable(tap: tap, enable: true); return enabled }
        let types: [CGEventType] = [.keyDown, .keyUp, .flagsChanged, .leftMouseDown, .rightMouseDown, .otherMouseDown]
        let mask = types.reduce(CGEventMask(0)) { $0 | (CGEventMask(1) << $1.rawValue) }
        guard let port = CGEvent.tapCreate(tap: .cgSessionEventTap, place: .headInsertEventTap, options: .defaultTap,
            eventsOfInterest: mask, callback: { proxy, type, event, info in
                guard let info else { return Unmanaged.passUnretained(event) }
                let monitor = Unmanaged<DoubleTap>.fromOpaque(info).takeUnretainedValue()
                return monitor.handle(proxy: proxy, type: type, event: event)
            }, userInfo: Unmanaged.passUnretained(self).toOpaque()) else { return false }
        tap = port
        source = CFMachPortCreateRunLoopSource(kCFAllocatorDefault, port, 0)
        CFRunLoopAddSource(CFRunLoopGetMain(), source, .commonModes)
        CGEvent.tapEnable(tap: port, enable: true)
        return true
    }
    func stop() {
        flush()
        if let tap { CGEvent.tapEnable(tap: tap, enable: false); CFMachPortInvalidate(tap) }
        if let source { CFRunLoopRemoveSource(CFRunLoopGetMain(), source, .commonModes) }
        tap = nil; source = nil; swallowRelease = false
    }
    private func flush(proxy: CGEventTapProxy? = nil) {
        timer?.invalidate(); timer = nil
        let events = buffered; buffered = []; firstReleased = false
        for event in events {
            event.setIntegerValueField(.eventSourceUserData, value: marker)
            if let proxy { event.tapPostEvent(proxy) }
            else { event.post(tap: .cgSessionEventTap) }
        }
    }
    private func handle(proxy: CGEventTapProxy, type: CGEventType, event: CGEvent) -> Unmanaged<CGEvent>? {
        if type == .tapDisabledByTimeout || type == .tapDisabledByUserInput {
            flush(); if let tap { CGEvent.tapEnable(tap: tap, enable: true) }
            return Unmanaged.passUnretained(event)
        }
        if event.getIntegerValueField(.eventSourceUserData) == marker { return Unmanaged.passUnretained(event) }
        let key = event.getIntegerValueField(.keyboardEventKeycode)
        if type == .keyUp && key == 50 && swallowRelease { swallowRelease = false; return nil }
        let modified = !event.flags.intersection([.maskCommand, .maskControl, .maskAlternate, .maskShift, .maskSecondaryFn]).isEmpty
        if key == 50 && !modified && (type == .keyDown || type == .keyUp) {
            if type == .keyUp && !buffered.isEmpty {
                if let copy = event.copy() { buffered.append(copy) }; firstReleased = true; return nil
            }
            if type == .keyDown {
                if event.getIntegerValueField(.keyboardEventAutorepeat) != 0 { flush(proxy: proxy); return Unmanaged.passUnretained(event) }
                if !buffered.isEmpty && firstReleased {
                    timer?.invalidate(); timer = nil; buffered = []; firstReleased = false; swallowRelease = true
                    DispatchQueue.main.async { self.onToggle?() }
                    return nil
                }
                flush(proxy: proxy)
                if let copy = event.copy() { buffered = [copy] }
                let timeout = Timer(timeInterval: interval, repeats: false) { [weak self] _ in self?.flush() }
                timer = timeout
                RunLoop.main.add(timeout, forMode: .common)
                return nil
            }
        }
        if !buffered.isEmpty { flush(proxy: proxy) }
        return Unmanaged.passUnretained(event)
    }
}

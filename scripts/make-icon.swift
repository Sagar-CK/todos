import AppKit
let size = 1024
let bitmap = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: size, pixelsHigh: size, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
let context = NSGraphicsContext(bitmapImageRep: bitmap)!
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = context
NSColor(white: 37.0 / 255, alpha: 1).setFill()
NSBezierPath(rect: NSRect(x: 0, y: 0, width: size, height: size)).fill()
NSColor(white: 0.65, alpha: 1).setStroke()
let box = NSBezierPath(roundedRect: NSRect(x: 252, y: 252, width: 520, height: 520), xRadius: 70, yRadius: 70)
box.lineWidth = 30; box.stroke()
NSColor(white: 0.95, alpha: 1).setStroke()
let check = NSBezierPath(); check.move(to: NSPoint(x: 365, y: 510)); check.line(to: NSPoint(x: 468, y: 410)); check.line(to: NSPoint(x: 667, y: 617))
check.lineWidth = 43; check.lineCapStyle = .round; check.lineJoinStyle = .round; check.stroke()
NSGraphicsContext.restoreGraphicsState()
try bitmap.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: CommandLine.arguments[1]))

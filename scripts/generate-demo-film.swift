import AppKit
import AVFoundation

// A replaceable, silent preview asset, not an AI-generated finished commercial.
let paths = Array(CommandLine.arguments.dropFirst(2))
let output = URL(fileURLWithPath: CommandLine.arguments[1])
let images = paths.compactMap { NSImage(contentsOfFile: $0) }
guard !images.isEmpty else { fatalError("No input images") }
try FileManager.default.createDirectory(at: output.deletingLastPathComponent(), withIntermediateDirectories: true)
let width = 540, height = 960, fps: Int32 = 24
let writer = try AVAssetWriter(outputURL: output, fileType: .mp4)
let input = AVAssetWriterInput(mediaType: .video, outputSettings: [AVVideoCodecKey: AVVideoCodecType.h264, AVVideoWidthKey: width, AVVideoHeightKey: height])
let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32ARGB, kCVPixelBufferWidthKey as String: width, kCVPixelBufferHeightKey as String: height])
writer.add(input)
writer.startWriting()
writer.startSession(atSourceTime: .zero)
let lines = ["下班后，来一碗热粉", "独立配料，丰盛一餐", "热气腾腾，酸辣开胃", "大促活动，以商品页为准"]
for frame in 0..<(20 * Int(fps)) {
    while !input.isReadyForMoreMediaData { Thread.sleep(forTimeInterval: 0.005) }
    var buffer: CVPixelBuffer?
    CVPixelBufferCreate(kCFAllocatorDefault, width, height, kCVPixelFormatType_32ARGB, [kCVPixelBufferCGImageCompatibilityKey: true, kCVPixelBufferCGBitmapContextCompatibilityKey: true] as CFDictionary, &buffer)
    guard let pixel = buffer else { fatalError("No pixel buffer") }
    CVPixelBufferLockBaseAddress(pixel, [])
    let context = CGContext(data: CVPixelBufferGetBaseAddress(pixel), width: width, height: height, bitsPerComponent: 8, bytesPerRow: CVPixelBufferGetBytesPerRow(pixel), space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue)!
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(cgContext: context, flipped: false)
    NSColor.black.setFill()
    NSRect(x: 0, y: 0, width: width, height: height).fill()
    let scene = frame / (5 * Int(fps))
    let image = images[scene % images.count]
    let progress = Double(frame % (5 * Int(fps))) / Double(5 * Int(fps))
    let scale = max(Double(width) / image.size.width, Double(height) / image.size.height) * (1 + progress * 0.05)
    let w = image.size.width * scale, h = image.size.height * scale
    image.draw(in: NSRect(x: (Double(width) - w) / 2, y: (Double(height) - h) / 2, width: w, height: h))
    NSColor(white: 0, alpha: 0.55).setFill()
    NSRect(x: 0, y: 60, width: width, height: 100).fill()
    let paragraph = NSMutableParagraphStyle(); paragraph.alignment = .center
    (lines[scene] as NSString).draw(in: NSRect(x: 16, y: 92, width: width - 32, height: 42), withAttributes: [.font: NSFont.systemFont(ofSize: 27, weight: .semibold), .foregroundColor: NSColor.white, .paragraphStyle: paragraph])
    ("DEMO · 素材预演" as NSString).draw(at: NSPoint(x: 20, y: height - 46), withAttributes: [.font: NSFont.systemFont(ofSize: 16), .foregroundColor: NSColor.white])
    NSGraphicsContext.restoreGraphicsState()
    CVPixelBufferUnlockBaseAddress(pixel, [])
    guard adaptor.append(pixel, withPresentationTime: CMTime(value: Int64(frame), timescale: fps)) else { fatalError(writer.error?.localizedDescription ?? "Append failed") }
}
input.markAsFinished()
let semaphore = DispatchSemaphore(value: 0)
writer.finishWriting { semaphore.signal() }
semaphore.wait()
guard writer.status == .completed else { fatalError(writer.error?.localizedDescription ?? "Export failed") }
print(output.path)

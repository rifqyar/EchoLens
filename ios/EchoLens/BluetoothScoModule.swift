import Foundation
import AVFoundation
import React

@objc(BluetoothScoModule)
class BluetoothScoModule: RCTEventEmitter {
  
  private var hasListeners = false
  
  override init() {
    super.init()
    // Register notification for audio route changes
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleRouteChange),
      name: AVAudioSession.routeChangeNotification,
      object: nil
    )
  }
  
  // MARK: - React Native setup
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  override func supportedEvents() -> [String]! {
    return ["BluetoothSco"]
  }
  
  override func startObserving() {
    hasListeners = true
  }
  
  override func stopObserving() {
    hasListeners = false
  }
  
  // MARK: - Public methods exposed to JS
  @objc func startSco() {
    do {
      let session = AVAudioSession.sharedInstance()
      try session.setCategory(.playAndRecord, mode: .voiceChat, options: [.allowBluetooth])
      try session.setActive(true)
      
      if hasListeners {
        sendEvent(withName: "BluetoothSco", body: "SCO CONNECTED (iOS)")
      }
      
    } catch {
      if hasListeners {
        sendEvent(withName: "BluetoothSco", body: "SCO ERROR: \(error.localizedDescription)")
      }
    }
  }
  
  @objc func stopSco() {
    do {
      let session = AVAudioSession.sharedInstance()
      try session.setActive(false)
      
      if hasListeners {
        sendEvent(withName: "BluetoothSco", body: "SCO DISCONNECTED (iOS)")
      }
      
    } catch {
      if hasListeners {
        sendEvent(withName: "BluetoothSco", body: "SCO ERROR: \(error.localizedDescription)")
      }
    }
  }
  
  // MARK: - Handle Route Changes
  @objc private func handleRouteChange(notification: Notification) {
    guard let info = notification.userInfo,
          let reasonValue = info[AVAudioSessionRouteChangeReasonKey] as? UInt,
          let reason = AVAudioSession.RouteChangeReason(rawValue: reasonValue) else { return }
    
    var message = "SCO ROUTE CHANGE: \(reason)"
    switch reason {
    case .newDeviceAvailable:
      message = "Bluetooth device connected"
    case .oldDeviceUnavailable:
      message = "Bluetooth device disconnected"
    default:
      break
    }
    
    if hasListeners {
      sendEvent(withName: "BluetoothSco", body: message)
    }
  }
}

import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import Firebase
import AVFoundation

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  @objc(logAudioRoute)
  func logAudioRoute() {
      let route = AVAudioSession.sharedInstance().currentRoute
      print("🔈 Current audio route:", route)

      for input in AVAudioSession.sharedInstance().availableInputs ?? [] {
          print("🎤 Input available:", input.portType.rawValue, "-", input.portName)
      }
  } 
  
  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    FirebaseApp.configure()
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "TactID",
      in: window,
      launchOptions: launchOptions
    )

    // ============================
    // ENABLE BLUETOOTH HFP MIC
    // ============================
    do {
        let session = AVAudioSession.sharedInstance()

        try session.setCategory(
            .playAndRecord,
            mode: .voiceChat, // WAJIB untuk HFP
            options: [
                .allowBluetooth,
                .defaultToSpeaker
            ]
        )

        try session.setActive(true)
        print("AVAudioSession configured for Bluetooth HFP mic")
        print("AVRoute after activation:", session.currentRoute)

        // cari input Bluetooth HFP (smart glasses)
        if let bluetoothInput = session.availableInputs?.first(where: { input in
            return input.portType == .bluetoothHFP
        }) {
            do {
                try session.setPreferredInput(bluetoothInput)
                print("Preferred input set to Bluetooth HFP:", bluetoothInput)
            } catch {
                print("Failed to set preferred input:", error)
            }
        } else {
            print("❌ Tidak ada Bluetooth HFP input terdeteksi!")
        }
    } catch {
        print("Failed to configure AVAudioSession:", error)
    }

    return true
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}

package com.optilens.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.media.AudioManager
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class BluetoothScoModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val audioManager: AudioManager =
        reactContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager

    private val scoReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == AudioManager.ACTION_SCO_AUDIO_STATE_UPDATED) {
                val state = intent.getIntExtra(AudioManager.EXTRA_SCO_AUDIO_STATE, -1)
                val msg = when (state) {
                    AudioManager.SCO_AUDIO_STATE_CONNECTING -> "SCO CONNECTING"
                    AudioManager.SCO_AUDIO_STATE_CONNECTED -> "SCO CONNECTED"
                    AudioManager.SCO_AUDIO_STATE_DISCONNECTED -> "SCO DISCONNECTED"
                    else -> "SCO STATE=$state"
                }
                Log.d("BluetoothScoModule", msg)

                // kirim ke JS via event emitter
                sendEvent("BluetoothSco", msg)
            }
        }
    }

    init {
        val filter = IntentFilter(AudioManager.ACTION_SCO_AUDIO_STATE_UPDATED)
        reactContext.registerReceiver(scoReceiver, filter)
    }

    override fun getName(): String = "BluetoothScoModule"

    @ReactMethod
    fun startSco() {
        Log.d("BluetoothScoModule", "Requesting startBluetoothSco...")
        audioManager.startBluetoothSco()
        audioManager.isBluetoothScoOn = true
    }

    @ReactMethod
    fun stopSco() {
        Log.d("BluetoothScoModule", "Stopping BluetoothSco...")
        audioManager.stopBluetoothSco()
        audioManager.isBluetoothScoOn = false
    }

    private fun sendEvent(eventName: String, params: String) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }
}

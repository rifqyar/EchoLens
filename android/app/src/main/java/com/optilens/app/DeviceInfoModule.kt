package com.optilens.app

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import android.os.Build

class DeviceInfoModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        // Nama modul yang akan diakses dari JavaScript
        return "DeviceInfoModule"
    }

    @ReactMethod
    fun getDeviceModel(promise: Promise) {
        try {
            val model = Build.MODEL ?: "Unknown"
            promise.resolve(model)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }
}

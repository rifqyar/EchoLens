package com.optilens.app.wifip2p

import android.content.Context
import android.net.wifi.p2p.WifiP2pDeviceList
import android.net.wifi.p2p.WifiP2pManager
import com.facebook.react.bridge.*

import org.json.JSONArray
import org.json.JSONObject

class WifiP2pModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var manager: WifiP2pManager? = null
    private var channel: WifiP2pManager.Channel? = null

    init {
        manager = reactContext.getSystemService(Context.WIFI_P2P_SERVICE) as WifiP2pManager
        manager?.let {
            channel = it.initialize(reactContext, reactContext.mainLooper, null)
        }
    }

    override fun getName(): String {
        return "WifiP2pModule"
    }

    @ReactMethod
    fun discoverPeers(promise: Promise) {
        if (manager == null || channel == null) {
            promise.reject("INIT_ERROR", "WifiP2pManager not initialized")
            return
        }

        manager?.discoverPeers(channel, object : WifiP2pManager.ActionListener {
            override fun onSuccess() {
                manager?.requestPeers(channel) { peers: WifiP2pDeviceList? ->
                    try {
                        val arr = JSONArray()
                        peers?.deviceList?.forEach { device ->
                            val obj = JSONObject()
                            obj.put("deviceName", device.deviceName)
                            obj.put("deviceAddress", device.deviceAddress)
                            obj.put("status", device.status)
                            arr.put(obj)
                        }
                        promise.resolve(arr.toString())
                    } catch (e: Exception) {
                        promise.reject("JSON_ERROR", e.message)
                    }
                }
            }

            override fun onFailure(reason: Int) {
                promise.reject("DISCOVER_FAILED", "Failed with reason code: $reason")
            }
        })
    }
}

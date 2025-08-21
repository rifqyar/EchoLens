package com.optilens.app

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Environment
import android.provider.MediaStore
import androidx.core.content.FileProvider
import com.facebook.react.bridge.*
import java.io.File
import java.text.SimpleDateFormat
import java.util.*

class CameraIntentModule(private val reactContext: ReactApplicationContext)
  : ReactContextBaseJavaModule(reactContext), ActivityEventListener {

  private var photoUri: Uri? = null
  private var videoUri: Uri? = null
  private var promise: Promise? = null

  private val REQ_IMAGE = 9911
  private val REQ_VIDEO = 9912

  init {
    reactContext.addActivityEventListener(this)
  }

  override fun getName(): String {
    return "CameraIntent"
  }

  private fun createTmpFile(prefix: String, suffix: String): File {
    val timeStamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
    val storageDir = reactContext.getExternalFilesDir(Environment.DIRECTORY_PICTURES)
    return File.createTempFile("${prefix}_${timeStamp}_", suffix, storageDir)
  }

  @ReactMethod
  fun capturePhoto(p: Promise) {
    val activity = currentActivity ?: run {
      p.reject("NO_ACTIVITY", "No activity")
      return
    }
    promise = p
    val file = createTmpFile("IMG", ".jpg")
    photoUri = FileProvider.getUriForFile(activity, activity.packageName + ".provider", file)
    val intent = Intent(MediaStore.ACTION_IMAGE_CAPTURE).apply {
      putExtra(MediaStore.EXTRA_OUTPUT, photoUri)
      addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION or Intent.FLAG_GRANT_READ_URI_PERMISSION)
    }
    activity.startActivityForResult(intent, REQ_IMAGE)
  }

  @ReactMethod
  fun captureVideo(maxSeconds: Int, p: Promise) {
    val activity = currentActivity ?: run {
      p.reject("NO_ACTIVITY", "No activity")
      return
    }
    promise = p
    val file = createTmpFile("VID", ".mp4")
    videoUri = FileProvider.getUriForFile(activity, activity.packageName + ".provider", file)
    val intent = Intent(MediaStore.ACTION_VIDEO_CAPTURE).apply {
      putExtra(MediaStore.EXTRA_OUTPUT, videoUri)
      putExtra(MediaStore.EXTRA_DURATION_LIMIT, maxSeconds)
      putExtra(MediaStore.EXTRA_VIDEO_QUALITY, 1)
      addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION or Intent.FLAG_GRANT_READ_URI_PERMISSION)
    }
    activity.startActivityForResult(intent, REQ_VIDEO)
  }

  // ✅ Versi lama untuk RN < 0.71
  override fun onActivityResult(
    activity: Activity,
    requestCode: Int,
    resultCode: Int,
    data: Intent?
  ) {
    if (promise == null) return

    when (requestCode) {
      REQ_IMAGE -> {
        if (resultCode == Activity.RESULT_OK && photoUri != null) {
          promise?.resolve(photoUri.toString())
        } else {
          promise?.reject("CANCELED", "Image capture canceled")
        }
      }
      REQ_VIDEO -> {
        if (resultCode == Activity.RESULT_OK) {
          val uri = data?.data ?: videoUri
          if (uri != null) {
            promise?.resolve(uri.toString())
          } else {
            promise?.reject("NO_URI", "No video URI returned")
          }
        } else {
          promise?.reject("CANCELED", "Video capture canceled")
        }
      }
    }
    promise = null
  }

  override fun onNewIntent(intent: Intent) {
    // Tidak digunakan
  }
}

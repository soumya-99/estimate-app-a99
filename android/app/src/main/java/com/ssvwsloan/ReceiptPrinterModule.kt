package com.estimateapp

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.BaseActivityEventListener
import com.eze.api.EzeAPI
import org.json.JSONObject
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import java.io.ByteArrayOutputStream
import android.app.Activity
import android.content.Intent

class ReceiptPrinterModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val REQUEST_CODE_INITIALIZE = 10001
    private val REQUEST_CODE_PRINT_BITMAP = 10029

    private var callback: Callback? = null

    init {
        reactContext.addActivityEventListener(object : BaseActivityEventListener() {
            override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
                if (requestCode == REQUEST_CODE_INITIALIZE) {
                    handleInitializeResult(resultCode, data)
                } else if (requestCode == REQUEST_CODE_PRINT_BITMAP) {
                    handlePrintResult(resultCode, data)
                }
            }
        })
    }

    override fun getName(): String {
        return "ReceiptPrinter"
    }

    @ReactMethod
    fun initializeEzeAPI(callback: Callback) {
        val activity = currentActivity
        if (activity != null) {
            val jsonRequest = JSONObject()
            // jsonRequest.put("demoAppKey", "a40c761a-b664-4bc6-ab5a-bf073aa797d5")
            // jsonRequest.put("prodAppKey", "a40c761a-b664-4bc6-ab5a-bf073aa797d5")
            // jsonRequest.put("merchantName", "SYNERGIC_SOFTEK_SOLUTIONS")
            // jsonRequest.put("userName", "9903044748")
            // jsonRequest.put("currencyCode", "INR")
            // jsonRequest.put("appMode", "DEMO")
            // jsonRequest.put("captureSignature", false)
            // jsonRequest.put("prepareDevice", false)
            jsonRequest.put("demoAppKey", "8b94d199-d50e-466b-9471-126ba33c0cdf")
            jsonRequest.put("prodAppKey", "8b94d199-d50e-466b-9471-126ba33c0cdf")
            jsonRequest.put("merchantName", "SYNERGIC_SOFTEK_SOLUT_SBI")
            jsonRequest.put("userName", "2115350300")
            jsonRequest.put("currencyCode", "INR")
            jsonRequest.put("appMode", "PROD")
            jsonRequest.put("captureSignature", false)
            jsonRequest.put("prepareDevice", false)

            this.callback = callback
            EzeAPI.initialize(activity, REQUEST_CODE_INITIALIZE, jsonRequest)
        } else {
            callback.invoke("Activity is null")
        }
    }

    private fun handleInitializeResult(resultCode: Int, data: Intent?) {
        if (data != null && data.hasExtra("response")) {
            try {
                if (resultCode == Activity.RESULT_OK) {
                    val response = JSONObject(data.getStringExtra("response")!!)
                    if (response.has("result")) {
                        // Initialization of SDK is successful, proceed with printing
                        callback?.invoke("Initialization successful")
                    }
                } else if (resultCode == Activity.RESULT_CANCELED) {
                    val response = JSONObject(data.getStringExtra("response")!!)
                    if (response.has("error")) {
                        val error = response.getJSONObject("error")
                        val errorCode = error.getString("code")
                        val errorMessage = error.getString("message")
                        callback?.invoke("Initialization failed: $errorCode - $errorMessage")
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
                callback?.invoke("Exception: ${e.message}")
            }
        }
    }

    @ReactMethod
    fun printCustomReceipt(base64String: String, callback: Callback) {
        val activity = currentActivity
        if (activity != null) {
            val bitmap = decodeBase64ToBitmap(base64String)
            val jsonRequest = JSONObject()
            val jsonImageObj = JSONObject()

            val encodedImageData = getEncoded64ImageStringFromBitmap(bitmap)

            // Building Image Object
            jsonImageObj.put("imageData", encodedImageData)
            jsonImageObj.put("imageType", "JPEG")
            jsonImageObj.put("height", "")  // optional
            jsonImageObj.put("weight", "")  // optional

            jsonRequest.put("image", jsonImageObj)  // Pass this attribute when you have a valid captured signature image

            this.callback = callback
            EzeAPI.printBitmap(activity, REQUEST_CODE_PRINT_BITMAP, jsonRequest)
        } else {
            callback.invoke("Activity is null")
        }
    }

    private fun handlePrintResult(resultCode: Int, data: Intent?) {
        if (data != null && data.hasExtra("response")) {
            try {
                if (resultCode == Activity.RESULT_OK) {
                    val response = JSONObject(data.getStringExtra("response")!!)
                    if (response.has("result")) {
                        callback?.invoke("Print successful")
                    }
                } else if (resultCode == Activity.RESULT_CANCELED) {
                    val response = JSONObject(data.getStringExtra("response")!!)
                    if (response.has("error")) {
                        val error = response.getJSONObject("error")
                        val errorCode = error.getString("code")
                        val errorMessage = error.getString("message")
                        callback?.invoke("Print failed: $errorCode - $errorMessage")
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
                callback?.invoke("Exception: ${e.message}")
            }
        }
    }

    private fun getEncoded64ImageStringFromBitmap(bitmap: Bitmap): String {
        val byteArrayOutputStream = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.JPEG, 100, byteArrayOutputStream)
        val byteArray = byteArrayOutputStream.toByteArray()
        return Base64.encodeToString(byteArray, Base64.DEFAULT)
    }

    private fun decodeBase64ToBitmap(base64Str: String): Bitmap {
        val decodedBytes = Base64.decode(base64Str, Base64.DEFAULT)
        return BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
    }
}

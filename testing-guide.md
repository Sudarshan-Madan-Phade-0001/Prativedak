# 🧪 Testing Bare Workflow Emergency System

## Prerequisites
- Android device or emulator
- Physical device recommended for SMS/Call testing

## Step 1: Build Native App
```bash
cd myApp
npx expo prebuild --clean
npx expo run:android
```

## Step 2: Test Current Features (Without Native Modules)
1. **Register/Login** with test data
2. **Add Emergency Contacts** in profile
3. **Go to Monitor Tab** → Click "Simulate Accident"
4. **Emergency Screen** opens with 30-second countdown
5. **Current Behavior**: Opens dialer/SMS apps (user must tap)

## Step 3: Install Native Modules (For Full Automation)
```bash
# Install required packages
npm install react-native-send-sms react-native-call-detection
npm install react-native-immediate-phone-call

# For Android - add to android/app/src/main/java/.../MainApplication.java
import com.reactnativecommunity.sms.SmsPackage;
import com.github.wumke.RNImmediatePhoneCall.RNImmediatePhoneCallPackage;

// Add to getPackages()
new SmsPackage(),
new RNImmediatePhoneCallPackage()
```

## Step 4: Create Native Android Module
Create `android/app/src/main/java/com/anonymous/prativedak/EmergencyModule.java`:

```java
package com.anonymous.prativedak;

import android.content.Intent;
import android.net.Uri;
import android.telephony.SmsManager;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

public class EmergencyModule extends ReactContextBaseJavaModule {
    public EmergencyModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "RNAutoSMS";
    }

    @ReactMethod
    public void sendSMS(String phoneNumber, String message, Promise promise) {
        try {
            SmsManager smsManager = SmsManager.getDefault();
            smsManager.sendTextMessage(phoneNumber, null, message, null, null);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("SMS_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void makeEmergencyCall(String phoneNumber, Promise promise) {
        try {
            Intent callIntent = new Intent(Intent.ACTION_CALL);
            callIntent.setData(Uri.parse("tel:" + phoneNumber));
            callIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getReactApplicationContext().startActivity(callIntent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("CALL_ERROR", e.getMessage());
        }
    }
}
```

## Step 5: Test Scenarios

### Scenario 1: Basic Emergency Flow
1. Open app → Login → Go to Monitor
2. Click "Simulate Accident"
3. Wait for 30-second countdown
4. **Expected**: Automatic SMS + Call + WhatsApp

### Scenario 2: Manual Emergency Actions
1. In Emergency screen, click "Send SMS"
2. Click "WhatsApp" 
3. Click "Call Now"
4. **Expected**: Immediate actions without countdown

### Scenario 3: Cancel Emergency
1. Trigger accident simulation
2. Click "Cancel" before countdown ends
3. **Expected**: No automatic actions triggered

## Step 6: Verify Results
- **SMS**: Check if SMS sent automatically to emergency contacts
- **Call**: Check if call made automatically to primary contact
- **WhatsApp**: Check if WhatsApp opens with pre-filled message
- **Firebase**: Check if emergency logged in database

## Testing Checklist
- [ ] App builds successfully with `expo run:android`
- [ ] Emergency screen opens from simulate accident
- [ ] 30-second countdown works
- [ ] Cancel button stops countdown
- [ ] Manual SMS button works
- [ ] Manual call button works
- [ ] Manual WhatsApp button works
- [ ] Location included in messages
- [ ] Emergency contacts receive messages
- [ ] Firebase logging works

## Current Status
✅ **Working**: Emergency screen, countdown, manual actions
⚠️ **Needs Native Modules**: Automatic SMS/Call without user tap
🔄 **Next Step**: Add native Android modules for full automation

## Quick Test Command
```bash
# Build and test immediately
npx expo prebuild --clean && npx expo run:android
```
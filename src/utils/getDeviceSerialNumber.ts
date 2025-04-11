import { Platform, PermissionsAndroid } from "react-native"
import DeviceInfo from "react-native-device-info"

async function getDeviceSerialNumber() {
    try {
        // For Android, ensure necessary permissions are granted.
        if (Platform.OS === 'android') {
            const hasPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE);
            if (!hasPermission) {
                const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE);
                if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                    console.warn('READ_PHONE_STATE permission denied');
                    return null;
                }
            }
        }
        // This method works only on Android. On iOS, it returns "unknown".
        const serialNumber = await DeviceInfo.getSerialNumber();
        return serialNumber;
    } catch (error) {
        console.error('Failed to get device serial number', error);
        return null;
    }
}

export default getDeviceSerialNumber
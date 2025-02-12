import React, { useRef, useEffect } from 'react';
import { View, Text, NativeModules, PermissionsAndroid, Platform } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import RNFS from 'react-native-fs';
import { CommonActions, useNavigation, useRoute } from '@react-navigation/native';
import { PrintTemplateScreenRouteProp } from '../../models/route_types';

const PrintTemplateScreen = () => {
  const navigation = useNavigation();
  const { params } = useRoute<PrintTemplateScreenRouteProp>();
  const viewRef = useRef<View>(null);
  const { ReceiptPrinter } = NativeModules;

  const text = params.textData;

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission Needed',
            message: 'This app needs storage permission to save images.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Storage permission denied');
          return false;
        }
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const handleCapture = async () => {
    if (!(await requestStoragePermission())) {
      return;
    }

    try {
      const uri = await captureRef(viewRef.current, {
        format: 'jpg',
        quality: 0.001,
      });

      const base64String = await RNFS.readFile(uri, 'base64');
      console.log(base64String);

      // Save the image in the current directory
      const path = `${RNFS.DocumentDirectoryPath}/sample.png`;
      await RNFS.writeFile(path, base64String, 'base64');
      console.log('Image saved at:', path);

      // Now you can use the base64String for printing or any other purpose
      ReceiptPrinter.initializeEzeAPI((message) => {
        console.log(message);
        if (message === "Initialization successful") {
          ReceiptPrinter.printCustomReceipt(base64String, (message) => {
            console.log(message);
          });
        }
        navigation.dispatch(CommonActions.goBack());
      });
    } catch (error) {
      console.error('Capture failed:', error);
    }
  };

  useEffect(() => {
    handleCapture();
  }, []);

  return (
    <View ref={viewRef} style={{ padding: 0, backgroundColor: "#FFFFFF", margin: 0 }}>
      <Text style={{ fontSize: 22, color: "#000000", textAlign: "center" }}>{text}</Text>
    </View>
  );
};

export default PrintTemplateScreen;

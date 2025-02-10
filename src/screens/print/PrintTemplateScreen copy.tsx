import React, { useRef, useEffect } from 'react';
import { View, Text, NativeModules } from 'react-native';
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

  const handleCapture = async () => {
    try {
      const uri = await captureRef(viewRef.current, {
        format: 'png',
        quality: 1,
      });

      const base64String = await RNFS.readFile(uri, 'base64');
      console.log(base64String);

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
      console.error(error);
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

import React, { useRef, useEffect } from 'react';
import { View, Text, NativeModules, PermissionsAndroid, Platform, ScrollView, Dimensions } from 'react-native';
import { CommonActions, useNavigation, useRoute } from '@react-navigation/native';
import { PrintTemplateScreenRouteProp } from '../../models/route_types';
import Canvas from 'react-native-canvas';
import RNFS from 'react-native-fs';

const PrintTemplateScreen = () => {
  const navigation = useNavigation();
  const { params } = useRoute<PrintTemplateScreenRouteProp>();
  const canvasRef = useRef(null);
  const { ReceiptPrinter } = NativeModules;

  const text = params?.textData;

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
      const canvas = canvasRef.current;
      if (canvas) {
        const context = canvas.getContext('2d');
        const { width, height } = Dimensions.get('window');

        // Set canvas dimensions to be larger than the viewport
        const canvasHeight = height * 2;  // Adjust this value based on your content height
        canvas.width = width;
        canvas.height = canvasHeight;

        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#000000';
        context.font = '20px Arial';
        context.textAlign = 'left';

        const lines = text.split('\n');
        lines.forEach((line, index) => {
          context.fillText(line, 10, 30 + index * 30);
        });

        // Capture the canvas as an image with very low quality
        canvas.toDataURL('image/jpeg', 0.0000000001).then(dataURL => {
          const base64String = dataURL.split(',')[1];
          console.log(base64String);

          // Save the image in the current directory
          const path = `${RNFS.DocumentDirectoryPath}/sample.jpg`;
          RNFS.writeFile(path, base64String, 'base64').then(() => {
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
          }).catch(error => {
            console.error('Save failed:', error);
          });
        }).catch(error => {
          console.error('Capture failed:', error);
        });
      }
    } catch (error) {
      console.error('Capture failed:', error);
    }
  };

  useEffect(() => {
    handleCapture();
  }, []);

  return (
    <ScrollView style={{ padding: 0, backgroundColor: "#FFFFFF", margin: 0, height: "auto", justifyContent: "center", alignItems: "center" }}>
      <Canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      {/* <ButtonPaper mode='elevated' onPress={handleCapture}>PRINT</ButtonPaper> */}
    </ScrollView>
  );
};

export default PrintTemplateScreen;

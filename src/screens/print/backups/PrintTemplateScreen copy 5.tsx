import React, { useRef, useEffect } from 'react';
import { ScrollView, Platform, Dimensions, PermissionsAndroid, NativeModules } from 'react-native';
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
        const { width } = Dimensions.get('window');

        // Set canvas dimensions to smaller size for low-quality output
        const canvasWidth = width / 2; // Reduce width
        const canvasHeight = text.split('\n').length * 13; // Adjust height based on reduced line height
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#000000';
        context.font = '13px Arial'; // Smaller font for compact size
        context.textAlign = 'center'; // Align text to center
        context.textBaseline = 'top';

        // Render text line by line
        const centerX = canvasWidth / 2; // Calculate horizontal center
        const startY = 10; // Top margin
        const lineHeight = 13; // Reduced vertical spacing
        const lines = text.split('\n');

        lines.forEach((line, index) => {
          context.fillText(line, centerX, startY + index * lineHeight); // Center text
        });

        // Export canvas to low-quality image
        canvas.toDataURL('image/jpeg', 0.0000001).then(dataURL => {
          const base64String = dataURL.split(',')[1];
          console.log(base64String);

          // Save the image
          const path = `${RNFS.DocumentDirectoryPath}/sample.jpg`;
          RNFS.writeFile(path, base64String, 'base64').then(() => {
            console.log('Image saved at:', path);

            // Printing logic
            ReceiptPrinter.initializeEzeAPI((message) => {
              console.log(message);
              if (message === 'Initialization successful') {
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
    <ScrollView
      style={{ padding: 0, backgroundColor: '#FFFFFF', margin: 0 }}
      contentContainerStyle={{
        height: 'auto',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </ScrollView>
  );
};

export default PrintTemplateScreen;

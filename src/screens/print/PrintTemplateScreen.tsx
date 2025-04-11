import React, { useRef, useEffect } from 'react';
import {
  ScrollView,
  Platform,
  Dimensions,
  PermissionsAndroid,
  NativeModules,
} from 'react-native';
import { CommonActions, useNavigation, useRoute } from '@react-navigation/native';
import Canvas from 'react-native-canvas';
import RNFS from 'react-native-fs';
import { WebView } from 'react-native-webview';
import { PrintTemplateScreenRouteProp } from '../../models/route_types';

if (!Canvas.WebView) {
  Canvas.WebView = WebView;
}

const PrintTemplateScreen = () => {
  const navigation = useNavigation();
  const { params } = useRoute<PrintTemplateScreenRouteProp>();
  const canvasRef = useRef(null);
  const { ReceiptPrinter } = NativeModules;
  const text = params?.textData || '';

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
        const canvasWidth = width / 2;
        const lines = text.split('\n');
        const lineHeight = 15; // Adjust as needed
        const canvasHeight = lines.length * lineHeight + 20;

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.fillStyle = '#000000';
        context.font = '13px Arial';
        context.textBaseline = 'top';

        const leftMargin = 10;
        const rightMargin = canvasWidth - 10;
        const centerX = canvasWidth / 2;
        const startY = 10;

        lines.forEach((line, index) => {
          const y = startY + index * lineHeight;
          const tokenRegex = /(\[L\]|\[C\]|\[R\])([^\[]+)/g;
          const segments = [];
          let lastIndex = 0;
          let match;

          while ((match = tokenRegex.exec(line)) !== null) {
            if (match.index > lastIndex) {
              segments.push({
                align: 'left',
                text: line.substring(lastIndex, match.index),
              });
            }

            const token = match[1];
            const segmentText = match[2];
            const align =
              token === '[C]' ? 'center' : token === '[R]' ? 'right' : 'left';
            segments.push({ align, text: segmentText });
            lastIndex = tokenRegex.lastIndex;
          }

          if (lastIndex < line.length) {
            segments.push({ align: 'left', text: line.substring(lastIndex) });
          }

          if (segments.length === 0) {
            segments.push({ align: 'left', text: line });
          }

          segments.forEach(segment => {
            context.textAlign = segment.align;
            const x =
              segment.align === 'left'
                ? leftMargin
                : segment.align === 'center'
                  ? centerX
                  : rightMargin;
            context.fillText(segment.text, x, y);
          });
        });

        canvas
          .toDataURL('image/jpeg', 1)
          .then(dataURL => {
            const base64String = dataURL.split(',')[1];

            const dirPath = `${RNFS.DownloadDirectoryPath}/print_longbitmap`;
            const filePath = `${dirPath}/Sample.jpg`;

            RNFS.mkdir(dirPath)
              .then(() => RNFS.writeFile(filePath, base64String, 'base64'))
              .then(() => {
                console.log('Image saved at:', filePath);
                ReceiptPrinter.initializeEzeAPI(message => {
                  console.log(message);
                  if (message === 'Initialization successful') {
                    ReceiptPrinter.printLargeReceipt(filePath, msg => {
                      console.log(msg);
                    });
                  }
                  // navigation.dispatch(CommonActions.navigate('ReceiptScreen'));
                  // navigation.dispatch(CommonActions.goBack());
                  navigation.dispatch(
                    CommonActions.reset({
                      index: 0,
                      routes: [
                        { name: 'ReceiptScreen' },
                        { name: 'OutpassScreenMain' },
                      ],
                    }),
                  );
                  navigation.dispatch(CommonActions.goBack());
                });
              })
              .catch(error => {
                console.error('Save failed:', error);
              });
          })
          .catch(error => {
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
      contentContainerStyle={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <Canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </ScrollView>
  );
};

export default PrintTemplateScreen;

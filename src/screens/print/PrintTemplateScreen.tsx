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

  // The text data may look like:
  // `[C]DUE REPORT\n[C]PRINT AT: ...\n[C]========================\n[C]DATE: ...\n[C]========================\n[L]   Name[C]Phone[R]Due\n[C]========================\n`
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

        // Set canvas dimensions
        const canvasWidth = width / 2;
        const lines = text.split('\n');
        const lineHeight = 15; // Adjust line height as needed
        const canvasHeight = lines.length * lineHeight + 20; // Adding a little extra padding

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // Draw white background
        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Set text properties
        context.fillStyle = '#000000';
        context.font = '13px Arial';
        context.textBaseline = 'top';

        // Define horizontal positions
        const leftMargin = 10;
        const rightMargin = canvasWidth - 10;
        const centerX = canvasWidth / 2;
        const startY = 10; // top margin

        // Process and render each line
        lines.forEach((line, index) => {
          const y = startY + index * lineHeight;

          // Tokenize the line. The regex matches tokens [L], [C], [R] 
          // followed by all characters until the next token (or end of line)
          const tokenRegex = /(\[L\]|\[C\]|\[R\])([^\[]+)/g;
          const segments = [];
          let lastIndex = 0;
          let match;

          // Loop through tokens in the line
          while ((match = tokenRegex.exec(line)) !== null) {
            // If there's any text before the token, add it as default left-aligned
            if (match.index > lastIndex) {
              segments.push({ align: 'left', text: line.substring(lastIndex, match.index) });
            }
            const token = match[1]; // e.g. "[L]", "[C]", or "[R]"
            const segmentText = match[2]; // The text following the token
            let align;
            if (token === '[L]') align = 'left';
            else if (token === '[C]') align = 'center';
            else if (token === '[R]') align = 'right';

            segments.push({ align, text: segmentText });
            lastIndex = tokenRegex.lastIndex;
          }
          // Add any remaining text after the last token as default left aligned.
          if (lastIndex < line.length) {
            segments.push({ align: 'left', text: line.substring(lastIndex) });
          }

          // If no tokens were found, add the whole line as a left-aligned segment.
          if (segments.length === 0) {
            segments.push({ align: 'left', text: line });
          }

          // Render each segment on the same line (y remains constant)
          segments.forEach(segment => {
            context.textAlign = segment.align;
            let x;
            if (segment.align === 'left') x = leftMargin;
            else if (segment.align === 'center') x = centerX;
            else if (segment.align === 'right') x = rightMargin;

            // Draw the segment text without the token
            context.fillText(segment.text, x, y);
          });
        });

        // Export canvas to a low-quality JPEG image
        canvas.toDataURL('image/jpeg', 0.0000001).then(dataURL => {
          const base64String = dataURL.split(',')[1];
          console.log(base64String);

          // Save the image locally
          const path = `${RNFS.DocumentDirectoryPath}/sample.jpg`;
          RNFS.writeFile(path, base64String, 'base64').then(() => {
            console.log('Image saved at:', path);

            // Initialize printer and send the image for printing
            ReceiptPrinter.initializeEzeAPI((message) => {
              console.log(message);
              if (message === 'Initialization successful') {
                ReceiptPrinter.printCustomReceipt(base64String, (msg) => {
                  console.log(msg);
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

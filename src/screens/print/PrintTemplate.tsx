import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Button, PermissionsAndroid, Platform } from 'react-native';
import ViewShot from 'react-native-view-shot';
import RNFS from 'react-native-fs';
import { ScrollView } from 'react-native';

const requestStoragePermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission',
          message: 'This app needs access to your storage to save images',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  } else {
    return true;
  }
};

const PrintTemplate = ({ receiptText }: { receiptText: string }) => {
  const viewShotRef = useRef<ViewShot>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);

  useEffect(() => {
    requestStoragePermission();
  }, []);

  const captureAndSaveImage = async () => {
    const hasPermission = await requestStoragePermission();
    if (hasPermission) {
      if (viewShotRef.current) {
        try {
          // Capture the view shot
          const uri = await viewShotRef.current.capture();
          console.log('Image saved to:', uri);

          // Define the target path
          const basePath = '/storage/emulated/0/print_longbitmap';
          const targetPath = `${basePath}/sample.jpg`;

          // Ensure the directory exists
          await RNFS.mkdir(basePath);

          // Move the captured image to the target path
          await RNFS.moveFile(uri, targetPath);
          console.log('Image moved to:', targetPath);
          setImagePath(targetPath);
        } catch (error) {
          console.error('Error capturing view:', error);
        }
      }
    } else {
      console.error('Storage permission not granted');
    }
  };

  return (
    <View>
      <ScrollView>
        <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }}>
          <Text>{receiptText}</Text>
        </ViewShot>
      </ScrollView>
      <Button title="Capture and Fetch Path" onPress={captureAndSaveImage} />
      {imagePath && <Text>Image Path: {imagePath}</Text>}
    </View>
  );
};

export default PrintTemplate;

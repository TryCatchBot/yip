import * as FileSystem from 'expo-file-system/legacy';

const PRODUCT_IMAGES_DIR = 'product_images';

export async function copyImageToPermanentStorage(
  sourceUri: string,
  base64?: string
): Promise<string> {
  try {
    if (!FileSystem.documentDirectory) {
      return sourceUri;
    }
    const ext = sourceUri.split('.').pop()?.toLowerCase() || 'jpg';
    const validExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
    const filename = `product_${Date.now()}_${Math.random().toString(36).slice(2)}.${validExt}`;
    const dir = `${FileSystem.documentDirectory}${PRODUCT_IMAGES_DIR}/`;
    const destUri = `${dir}${filename}`;

    const dirInfo = await FileSystem.getInfoAsync(dir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }

    if (base64) {
      await FileSystem.writeAsStringAsync(destUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return destUri;
    }

    try {
      await FileSystem.copyAsync({
        from: sourceUri,
        to: destUri,
      });
      return destUri;
    } catch {
      const base64Data = await FileSystem.readAsStringAsync(sourceUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await FileSystem.writeAsStringAsync(destUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return destUri;
    }
  } catch {
    return sourceUri;
  }
}

export async function deleteProductImage(uri: string): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) {
      await FileSystem.deleteAsync(uri);
    }
  } catch {
    
  }
}

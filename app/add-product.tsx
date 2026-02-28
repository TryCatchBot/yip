import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { MAX_PRODUCTS, useProducts } from '@/context/ProductsContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { GRAY_LIGHT, ICON_MUTED, RED_DELETE, WHITE } from '@/constants/colors';

interface ProductEntry {
  id: string;
  photo: string | null;
  photoBase64?: string;
  name: string;
  price: string;
}

function ProductEntryRow({
  entry,
  onPhotoPress,
  onNameChange,
  onPriceChange,
  onRemove,
  canRemove,
  iconColor,
  textColor,
  primaryColor,
}: {
  entry: ProductEntry;
  onPhotoPress: () => void;
  onNameChange: (value: string) => void;
  onPriceChange: (value: string) => void;
  onRemove: () => void;
  canRemove: boolean;
  iconColor: string;
  textColor: string;
  primaryColor: string;
}) {
  return (
    <View style={styles.entryCard}>
      <Pressable
        style={({ pressed }) => [styles.photoButton, pressed && styles.photoButtonPressed]}
        onPress={onPhotoPress}>
        {entry.photo ? (
          <Image source={{ uri: entry.photo }} style={styles.photo} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <IconSymbol name="plus.circle.fill" size={32} color={primaryColor} />
            <ThemedText style={styles.photoPlaceholderText}>Add photo</ThemedText>
          </View>
        )}
      </Pressable>

      <ThemedText style={styles.label}>Product name</ThemedText>
      <TextInput
        style={[styles.input, { color: textColor, borderColor: GRAY_BORDER }]}
        placeholder="e.g. Wireless Headphones"
        placeholderTextColor={iconColor}
        value={entry.name}
        onChangeText={onNameChange}
        autoCapitalize="words"
      />

      <ThemedText style={styles.label}>Price (₦)</ThemedText>
      <TextInput
        style={[styles.input, { color: textColor, borderColor: GRAY_BORDER }]}
        placeholder="0.00"
        placeholderTextColor={iconColor}
        value={entry.price}
        onChangeText={onPriceChange}
        keyboardType="decimal-pad"
      />

      {canRemove && (
        <TouchableOpacity style={styles.removeEntryButton} onPress={onRemove}>
          <IconSymbol name="trash" size={20} color={RED_DELETE} />
          <ThemedText style={styles.removeEntryText}>Remove</ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function AddProductScreen() {
  const { addProduct, isLimitReached, products } = useProducts();
  const [entries, setEntries] = useState<ProductEntry[]>([
    { id: '1', photo: null, name: '', price: '' },
  ]);

  const iconColor = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'tint');

  const slotsRemaining = MAX_PRODUCTS - products.length;
  const canAddMore = entries.length < 5 && entries.length < slotsRemaining;

  const hasValidEntry = entries.some((e) => {
    const trimmedName = e.name.trim();
    const priceNum = parseFloat(e.price.replace(/[^0-9.]/g, ''));
    return trimmedName && !isNaN(priceNum) && priceNum >= 0 && !!e.photo;
  });
  const canSave = !isLimitReached && hasValidEntry;

  const pickImage = async (entryId: string) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library to add product images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setEntries((prev) =>
        prev.map((e) =>
          e.id === entryId
            ? {
                ...e,
                photo: asset.uri,
                photoBase64: asset.base64 ?? undefined,
              }
            : e
        )
      );
    }
  };

  const addEntry = () => {
    if (!canAddMore) return;
    setEntries((prev) => [
      ...prev,
      { id: Date.now().toString(), photo: null, name: '', price: '' },
    ]);
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => (prev.length > 1 ? prev.filter((e) => e.id !== id) : prev));
  };

  const updateEntry = (id: string, field: 'name' | 'price', value: string) => {
    setEntries((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        if (field === 'price') {
          const numericOnly = value.replace(/[^0-9.]/g, '');
          const firstDot = numericOnly.indexOf('.');
          const hasDecimal = firstDot !== -1;
          const intPart = hasDecimal ? numericOnly.slice(0, firstDot) : numericOnly;
          const decPart = hasDecimal ? numericOnly.slice(firstDot + 1).replace(/\D/g, '').slice(0, 2) : '';
          const price = hasDecimal ? `${intPart}.${decPart}` : intPart;
          return { ...e, price };
        }
        return { ...e, [field]: value };
      })
    );
  };

  const handleSave = async () => {
    if (isLimitReached) {
      Alert.alert(
        'Limit Reached',
        'You have reached the maximum of 5 products. Remove a product to add more.',
        [{ text: 'OK' }]
      );
      return;
    }

    const validEntries = entries.filter((e) => {
      const trimmedName = e.name.trim();
      const priceNum = parseFloat(e.price.replace(/[^0-9.]/g, ''));
      return trimmedName && !isNaN(priceNum) && priceNum >= 0 && e.photo;
    });

    if (validEntries.length === 0) {
      Alert.alert('Missing information', 'Please fill in photo, name, and price for at least one product.');
      return;
    }

    const invalidEntries = entries.filter((e) => {
      const trimmedName = e.name.trim();
      const priceNum = parseFloat(e.price.replace(/[^0-9.]/g, ''));
      return !trimmedName || isNaN(priceNum) || priceNum < 0 || !e.photo;
    });

    if (invalidEntries.length > 0) {
      Alert.alert(
        'Incomplete products',
        'Some products are missing photo, name, or price. Please complete all fields or remove empty entries.'
      );
      return;
    }

    let added = 0;
    for (const e of entries) {
      const trimmedName = e.name.trim();
      const priceNum = parseFloat(e.price.replace(/[^0-9.]/g, ''));
      if (trimmedName && !isNaN(priceNum) && priceNum >= 0 && e.photo && added < slotsRemaining) {
        const permanentPhotoUri = await copyImageToPermanentStorage(e.photo, e.photoBase64);
        addProduct({
          name: trimmedName,
          photo: permanentPhotoUri,
          price: priceNum.toFixed(2),
        });
        added++;
      }
    }

    const newCount = products.length + added;
    if (newCount >= MAX_PRODUCTS) {
      Alert.alert(
        'Limit Reached',
        'Your products have been added. You have reached the maximum of 5 products. Remove a product to add more.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } else {
      Toast.show({
        type: 'success',
        text1: 'Products added',
        text2: `${added} product${added > 1 ? 's' : ''} added successfully.`,
      });
      router.back();
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              Add Product
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Add up to {slotsRemaining} product{slotsRemaining !== 1 ? 's' : ''}
            </ThemedText>
          </View>

          {entries.map((entry, index) => (
            <View key={entry.id}>
              {entries.length > 1 && (
                <ThemedText style={styles.entryNumber}>Product {index + 1}</ThemedText>
              )}
              <ProductEntryRow
                entry={entry}
                onPhotoPress={() => pickImage(entry.id)}
                onNameChange={(v) => updateEntry(entry.id, 'name', v)}
                onPriceChange={(v) => updateEntry(entry.id, 'price', v)}
                onRemove={() => removeEntry(entry.id)}
                canRemove={entries.length > 1}
                iconColor={iconColor}
                textColor={textColor}
                primaryColor={primaryColor}
              />
            </View>
          ))}

          {canAddMore && (
            <Pressable
              style={({ pressed }) => [
                styles.addEntryButton,
                { borderColor: primaryColor },
                pressed && styles.addEntryButtonPressed,
              ]}
              onPress={addEntry}>
              <IconSymbol name="plus.circle.fill" size={24} color={primaryColor} />
              <ThemedText style={[styles.addEntryText, { color: primaryColor }]}>
                Add another product
              </ThemedText>
            </Pressable>
          )}

          <Pressable
            style={[
              styles.saveButton,
              { backgroundColor: canSave ? primaryColor : GRAY_MUTED_ALT },
              !canSave && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!canSave}>
            <ThemedText style={styles.saveButtonText}>
              {isLimitReached ? `Limit reached (${MAX_PRODUCTS}/5)` : 'Save Products'}
            </ThemedText>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 28,
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  entryNumber: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.6,
    marginBottom: 8,
    marginTop: 8,
  },
  entryCard: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_LIGHT,
  },
  photoButton: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  photoButtonPressed: {
    opacity: 0.8,
  },
  photo: {
    width: 140,
    height: 140,
    borderRadius: 16,
  },
  photoPlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: ICON_MUTED,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GRAY_PLACEHOLDER,
    gap: 8,
  },
  photoPlaceholderText: {
    color: ICON_MUTED,
    fontSize: 14,
    fontWeight: '500',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1,
    borderColor: ICON_MUTED,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  removeEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  removeEntryText: {
    color: RED_DELETE,
    fontSize: 14,
    fontWeight: '500',
  },
  addEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 18,
    marginBottom: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: ICON_MUTED,
    borderRadius: 12,
  },
  addEntryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  saveButtonDisabled: {
    backgroundColor: ICON_MUTED,
    opacity: 0.7,
  },
  saveButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
});

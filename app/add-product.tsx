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
import { MAX_PRODUCTS, useProducts } from '@/context/ProductsContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface ProductEntry {
  id: string;
  photo: string | null;
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
}: {
  entry: ProductEntry;
  onPhotoPress: () => void;
  onNameChange: (value: string) => void;
  onPriceChange: (value: string) => void;
  onRemove: () => void;
  canRemove: boolean;
  iconColor: string;
  textColor: string;
}) {
  return (
    <View style={styles.entryCard}>
      <Pressable style={styles.photoButton} onPress={onPhotoPress}>
        {entry.photo ? (
          <Image source={{ uri: entry.photo }} style={styles.photo} />
        ) : (
          <ThemedView style={styles.photoPlaceholder}>
            <ThemedText style={styles.photoPlaceholderText}>Tap to add photo</ThemedText>
          </ThemedView>
        )}
      </Pressable>

      <ThemedText style={styles.label}>Product name</ThemedText>
      <TextInput
        style={[styles.input, { color: textColor }]}
        placeholder="Enter product name"
        placeholderTextColor={iconColor}
        value={entry.name}
        onChangeText={onNameChange}
        autoCapitalize="words"
      />

      <ThemedText style={styles.label}>Price</ThemedText>
      <TextInput
        style={[styles.input, { color: textColor }]}
        placeholder="0.00"
        placeholderTextColor={iconColor}
        value={entry.price}
        onChangeText={onPriceChange}
        keyboardType="decimal-pad"
      />

      {canRemove && (
        <TouchableOpacity style={styles.removeEntryButton} onPress={onRemove}>
          <IconSymbol name="trash" size={20} color="#e74c3c" />
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
    });

    if (!result.canceled && result.assets[0]) {
      setEntries((prev) =>
        prev.map((e) => (e.id === entryId ? { ...e, photo: result.assets![0].uri } : e))
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

  const handleSave = () => {
    if (isLimitReached) {
      Alert.alert(
        'Product limit reached',
        `You can only add up to ${MAX_PRODUCTS} products. Remove a product to add a new one.`
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
        addProduct({
          name: trimmedName,
          photo: e.photo,
          price: priceNum.toFixed(2),
        });
        added++;
      }
    }

    const newCount = products.length + added;
    if (newCount >= MAX_PRODUCTS) {
      Toast.show({
        type: 'success',
        text1: 'Products added',
        text2: `You've reached the maximum of ${MAX_PRODUCTS} products.`,
      });
    } else {
      Toast.show({
        type: 'success',
        text1: 'Products added',
        text2: `${added} product${added > 1 ? 's' : ''} added successfully.`,
      });
    }
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <ThemedText type="subtitle" style={styles.title}>
            Add Product
          </ThemedText>

          {entries.map((entry) => (
            <ProductEntryRow
              key={entry.id}
              entry={entry}
              onPhotoPress={() => pickImage(entry.id)}
              onNameChange={(v) => updateEntry(entry.id, 'name', v)}
              onPriceChange={(v) => updateEntry(entry.id, 'price', v)}
              onRemove={() => removeEntry(entry.id)}
              canRemove={entries.length > 1}
              iconColor={iconColor}
              textColor={textColor}
            />
          ))}

          {canAddMore && (
            <Pressable style={styles.addEntryButton} onPress={addEntry}>
              <IconSymbol name="plus.circle.fill" size={32} color={primaryColor} />
              <ThemedText style={[styles.addEntryText, { color: primaryColor }]}>
                Add another product
              </ThemedText>
            </Pressable>
          )}

          <Pressable
            style={[
              styles.saveButton,
              { backgroundColor: isLimitReached ? undefined : primaryColor },
              isLimitReached && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={isLimitReached}>
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
  title: {
    marginBottom: 24,
  },
  entryCard: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  photoButton: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#687076',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderText: {
    color: '#687076',
    fontSize: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#687076',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  removeEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  removeEntryText: {
    color: '#e74c3c',
    fontSize: 14,
  },
  addEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#687076',
    borderRadius: 12,
  },
  addEntryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#687076',
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

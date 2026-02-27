import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MAX_PRODUCTS, useProducts, type Product } from '@/context/ProductsContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';

const PINK_LIGHT = '#F8E8E8';
const PINK_ACCENT = '#E8B4B8';
const PINK_DARK = '#C97B80';
const GRAY_LIGHT = '#E5E5E5';
const GRAY_TEXT = '#4A4A4A';
const GRAY_MUTED = '#9B9B9B';

const CARD_GAP = 12;
const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 40 - CARD_GAP) / 2;
const RED_DELETE = '#E74C3C';

type SortOption = 'name' | 'price-low' | 'price-high';

function formatPriceDisplay(priceStr: string): string {
  const num = parseFloat(priceStr);
  if (isNaN(num)) return priceStr;
  if (num >= 1_000_000) {
    const millions = num / 1_000_000;
    return millions % 1 === 0 ? `${millions}m` : `${millions.toFixed(1)}m`;
  }
  const parts = num.toFixed(2).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

function ProductCard({
  product,
  isExpanded,
  onToggleExpand,
  onRemove,
}: {
  product: Product;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onRemove: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardImageContainer}>
        <Image source={{ uri: product.photo }} style={styles.cardImage} />
      </View>
      <View style={styles.cardContent}>
        <TouchableOpacity
          style={styles.cardNameTouchable}
          onPress={onToggleExpand}
          activeOpacity={0.7}>
          <Text
            style={styles.cardName}
            numberOfLines={isExpanded ? undefined : 1}
            ellipsizeMode="tail">
            {product.name}
          </Text>
        </TouchableOpacity>
        <ThemedText style={styles.cardPrice}>₦ {formatPriceDisplay(product.price)}</ThemedText>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => {
            Alert.alert('Remove product', `Remove "${product.name}"?`, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Remove', style: 'destructive', onPress: onRemove },
            ]);
          }}>
          <IconSymbol name="trash" size={16} color={RED_DELETE} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ProductsScreen() {
  const { products, removeProduct, isLimitReached, isLoading } = useProducts();
  const primaryColor = useThemeColor({}, 'tint');
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const sortBottomSheetRef = useRef<BottomSheetModal>(null);

  const handlePresentSort = useCallback(() => {
    sortBottomSheetRef.current?.present();
  }, []);

  const handleSortSelect = useCallback((opt: SortOption) => {
    setSortBy(opt);
    sortBottomSheetRef.current?.dismiss();
  }, []);

  const filteredAndSorted = useMemo(() => {
    let list = products;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) || p.price.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      const pa = parseFloat(a.price);
      const pb = parseFloat(b.price);
      return sortBy === 'price-low' ? pa - pb : pb - pa;
    });
  }, [products, search, sortBy]);

  const handleAddPress = () => {
    if (isLimitReached) {
      Alert.alert(
        'Product limit reached',
        `You can only add up to ${MAX_PRODUCTS} products. Remove a product to add a new one.`
      );
      return;
    }
    router.push('/add-product');
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <ProductCard
      product={item}
      isExpanded={expandedProductId === item.id}
      onToggleExpand={() =>
        setExpandedProductId((prev) => (prev === item.id ? null : item.id))
      }
      onRemove={() => removeProduct(item.id)}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          My Products
        </ThemedText>
      </View>

      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor={GRAY_MUTED}
          value={search}
          onChangeText={setSearch}
        />
        <IconSymbol name="magnifyingglass" size={20} color={GRAY_MUTED} style={styles.searchIcon} />
      </View>

      {products.length > 0 && (
        <View style={styles.controls}>
          <ThemedText style={styles.resultCount}>
            {filteredAndSorted.length} Product{filteredAndSorted.length !== 1 ? 's' : ''} result
            {filteredAndSorted.length !== 1 ? 's' : ''}
          </ThemedText>
          <TouchableOpacity style={styles.sortButton} onPress={handlePresentSort}>
            <ThemedText style={styles.sortText}>Sort by</ThemedText>
            <IconSymbol name="chevron.down" size={18} color={GRAY_TEXT} />
          </TouchableOpacity>
        </View>
      )}

      {isLoading ? (
        <ThemedView style={styles.emptyState}>
          <ActivityIndicator size="large" color={primaryColor} />
          <ThemedText style={styles.emptyText}>Loading products...</ThemedText>
        </ThemedView>
      ) : products.length === 0 ? (
        <ThemedView style={styles.emptyState}>
          <IconSymbol name="cube.box" size={64} color={GRAY_MUTED} />
          <ThemedText type="subtitle" style={styles.emptyTitle}>
            No products yet
          </ThemedText>
          <ThemedText style={styles.emptyText}>
            Tap the button below to add your first product
          </ThemedText>
        </ThemedView>
      ) : search.trim() && filteredAndSorted.length === 0 ? (
        <ThemedView style={styles.emptyState}>
          <ThemedText type="subtitle" style={styles.emptyTitle}>
            No products match your search
          </ThemedText>
          <ThemedText style={styles.emptyText}>
            Try a different search term
          </ThemedText>
        </ThemedView>
      ) : (
        <FlatList
          data={filteredAndSorted}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
        />
      )}

      {!isLoading && !isLimitReached && (
        <Pressable
          style={[
            styles.addProductButton,
            {
              backgroundColor: primaryColor,
              bottom: Math.max(insets.bottom, 16),
            },
          ]}
          onPress={handleAddPress}>
          <ThemedText style={styles.addProductButtonText}>Add Product</ThemedText>
        </Pressable>
      )}

      <BottomSheetModal
        ref={sortBottomSheetRef}
        snapPoints={['35%']}
        enablePanDownToClose>
        <BottomSheetView style={styles.sortSheetContent}>
          <ThemedText type="subtitle" style={styles.sortModalTitle}>
            Sort by
          </ThemedText>
          {(['name', 'price-low', 'price-high'] as const).map((opt) => (
            <TouchableOpacity
              key={opt}
              style={styles.sortOption}
              onPress={() => handleSortSelect(opt)}>
              <ThemedText style={sortBy === opt ? styles.sortOptionActive : styles.sortOptionText}>
                {opt === 'name' ? 'Name' : opt === 'price-low' ? 'Price: Low to High' : 'Price: High to Low'}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerTitle: {
    color: GRAY_TEXT,
  },
  addProductButton: {
    position: 'absolute',
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 10,
  },
  addProductButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: GRAY_LIGHT,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: GRAY_TEXT,
  },
  searchIcon: {
    marginLeft: 8,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  resultCount: {
    fontSize: 14,
    fontWeight: '600',
    color: GRAY_TEXT,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: GRAY_LIGHT,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  sortText: {
    fontSize: 14,
    color: GRAY_TEXT,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 140,
  },
  row: {
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: PINK_LIGHT,
    shadowColor: PINK_ACCENT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  cardImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: GRAY_LIGHT,
  },
  cardContent: {
    position: 'relative',
    width: '100%',
    minWidth: 0,
    paddingRight: 36,
  },
  cardNameTouchable: {
    width: '100%',
    maxWidth: '100%',
  },
  cardName: {
    fontSize: 14,
    fontWeight: '600',
    color: GRAY_TEXT,
    marginBottom: 4,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: GRAY_TEXT,
  },
  removeButton: {
    position: 'absolute',
    top: -4,
    right: 0,
    padding: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    color: GRAY_TEXT,
  },
  emptyText: {
    textAlign: 'center',
    color: GRAY_MUTED,
    marginBottom: 24,
  },
  sortSheetContent: {
    padding: 24,
    paddingBottom: 32,
  },
  sortModalTitle: {
    marginBottom: 16,
    color: GRAY_TEXT,
  },
  sortOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_LIGHT,
  },
  sortOptionText: {
    fontSize: 16,
    color: GRAY_TEXT,
  },
  sortOptionActive: {
    fontSize: 16,
    fontWeight: '600',
    color: PINK_DARK,
  },
});

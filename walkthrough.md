# Walkthrough: Product Upload Mobile App

## Task Overview

Build a mobile app that lets users:
- Upload up to 5 products
- Input name, photo, and price for each product
- Get notified when the product limit is reached
- Use local state management (Redux, Context, or similar)

---

## Approach & Architecture

### 1. Technology Stack

- **Framework**: Expo (React Native) with SDK 54
- **Routing**: Expo Router (file-based routing)
- **State Management**: React Context API (no Redux needed for this scope)
- **Persistence**: AsyncStorage + expo-file-system for images

### 2. State Management Architecture

I chose **React Context** over Redux because:
- The app is small and the state is straightforward (products list, favorites)
- No need for middleware, complex reducers, or async handling
- Context provides a clean API for add/remove/toggle operations
- Easy to extend with persistence via `useEffect` hooks

**ProductsContext** (`context/ProductsContext.tsx`) holds:
- `products` – array of product objects
- `addProduct`, `removeProduct`, `toggleFavorite` – actions
- `isLimitReached` – derived boolean
- `isLoading` – for async persistence

### 3. Data Persistence

**Products** and **favorites** are persisted to AsyncStorage:

- On mount: load from AsyncStorage
- On change: save to AsyncStorage when products or favorites update

**Images** are persisted to the device filesystem:

- `expo-image-picker` returns temporary URIs (cache can be cleared)
- `expo-file-system` copies images to `documentDirectory/product_images/`
- Uses base64 when available (reliable on Android) or copyAsync/readAsStringAsync as fallback
- On product removal: delete the image file from disk

---

## Implementation Flow

### Phase 1: Core Features

1. **ProductsContext** – Created context with product state, add/remove logic, and 5-product limit
2. **Add Product Screen** – Modal with form for name, photo (image picker), and price
3. **Products Screen** – List of products with remove button
4. **Limit Notification** – Alert when limit reached

### Phase 2: UI & UX

1. **Product Grid** – Two-column layout with cards (image, name, price)
2. **Search** – Filter products by name or price
3. **Sort** – Bottom sheet with Name, Price Low→High, Price High→Low
4. **Product Truncation** – Single-line names with ellipsis; tap to expand

### Phase 3: Polish

1. **Price Formatting** – Comma-separated; values ≥1M shown as "1m", "1.2m"
2. **Add Product** – Sticky bottom button with primary color
3. **Notification** – Bell icon with +1 badge when limit reached; bottom sheet on tap
4. **Multi-product Add** – Plus button to add multiple product entries in one session

### Phase 4: Persistence

1. **AsyncStorage** – Persist products and favorites
2. **Image Storage** – Copy images to permanent storage before saving
3. **Loading State** – Show spinner while loading from storage

---

## Key Files & Responsibilities

| File | Purpose |
|------|---------|
| `context/ProductsContext.tsx` | State, persistence, limit logic |
| `app/(tabs)/index.tsx` | Products list, search, sort, grid, bell |
| `app/add-product.tsx` | Add product form, multi-entry, image picker |
| `utils/storage.ts` | Copy images to filesystem, delete on remove |
| `app/_layout.tsx` | Providers (Products, Toast, BottomSheet, GestureHandler) |

---

## Decisions & Rationale

### Why Bottom Sheet for Notifications?

- Less intrusive than modal dialogs
- Consistent with Sort UI
- Matches the requirement for “notification” rather than a blocking alert

### Why Copy Images Before Saving?

- Picker URIs point to cache; they can be cleared on app restart
- `documentDirectory` is persistent across sessions
- Base64 fallback ensures reliable behavior on Android (`content://` URIs)

### Why Naira (₦)?

- Task specified Nigerian context (currency)

### Why Truncation?

- Long product names can break the grid layout
- Tap to expand keeps the UI clean while allowing full access

---

## Testing Checklist

- [ ] Add up to 5 products
- [ ] Add Product button hidden when at limit
- [ ] Bell shows +1 badge when at limit
- [ ] Bell tap opens limit bottom sheet
- [ ] Search filters by name and price
- [ ] Sort changes order
- [ ] Product names truncate; tap to expand
- [ ] Price format: comma-separated, 1m for millions
- [ ] Refresh app: products and images persist
- [ ] Remove product: product and image removed

---

## How to Run

### Option 1: Preview Build on Physical Devices (Recommended)

A preview build is available via Expo EAS. Download and install directly on your device:

1. **Open the build link**  
   [Expo EAS Build](https://expo.dev/accounts/pie-app/projects/pie-app/builds/66a0f47c-9c4e-4dcc-8914-1bbaaab0b588)

2. **Download**
   - **iOS**: Tap the build link on your iPhone/iPad and follow the install prompt (you may need to trust the developer in Settings → General → VPN & Device Management).
   - **Android**: Tap the build link on your device and download the APK, then open it to install (enable "Install from unknown sources" if prompted).

3. **Install & test**
   - Install the app on your device.
   - Open it and test the full flow: add products, use the camera/gallery, and verify persistence after closing and reopening.

### Option 2: Local Development

```bash
npm install
npx expo start
```

Press `i` for iOS simulator or `a` for Android emulator.

### Option 3: Native Build (Local)

For building and running locally (e.g. to test image persistence):

```bash
npx expo prebuild --clean
npx expo run:ios
# or
npx expo run:android
```

# 🧋 Helcy's Boba & Momos — College Fest Order Tracker

A fast, mobile-friendly order tracking and kitchen display web application designed specifically for Helcy's college food stall in India.

---

## 🌟 Key Features

### 1. 📝 Quick Order POS (Fast Order Taking)
- **Menu Items & Fixed Pricing**:
  - 🍏 Green Apple Boba (Rs. 150)
  - 🍊 Orange Boba (Rs. 150)
  - 🍓 Strawberry Boba (Rs. 150)
  - 🫐 Blueberry Boba (Rs. 150)
  - 🥟 Steamed Momos (Rs. 120)
- **Fast Customer Details**:
  - Customer Name (Required)
  - Contact / Phone Number (Optional)
  - Payment method toggle: **Cash** or **Online (UPI / GPay / Paytm / PhonePe)**
  - Special Instructions / Remarks (e.g. *Less sweet*, *Extra spicy chutney*, *No ice*, or custom input)
- **Auto-Calculations**: Running item totals, grand total (₹), and auto-incrementing Token Numbers (`#101`, `#102`, etc.).
- **Audio & Visual Feedback**: Plays a pleasant audio chime and bursts confetti upon order confirmation.

### 2. 🍳 Live Kitchen Queue (Preparation & Pickup)
- **Real-Time Display**: Shows only pending orders currently in **Preparing** or **Ready** state.
- **Checklist Mode**: The kitchen cook can tap items to check them off as they are prepared.
- **Elapsed Time Timer**: Shows how many minutes ago each order was placed.
- **One-Click WhatsApp Ping**: If a contact number was entered, click the **"Ping Ready"** button to open WhatsApp with a pre-written message: *"Hi [Name]! Your order #[Token] is READY for pickup at Helcy's stall!"*
- **Order Handover / Completion**:
  - Click **"Complete & Hand Over"** once given to customer.
  - The order **immediately disappears from the live screen** with an audio confirmation.
  - Includes an **"Undo"** option in case of accidental clicks.

### 3. 📊 Sales & Past Orders Breakdown (Full Analytics)
- **Financial Breakdown**:
  - Total Sales Revenue (₹)
  - Cash in Hand vs Online / UPI Collected
  - Total Orders Count
  - Average Order Value
- **Item-by-Item Breakdown**:
  - Units sold and total revenue for each Boba flavor and Momos
  - Percentage share of total sales
- **Past Orders History Table**:
  - View all past orders with timestamp, customer details, items, payment method, and status.
  - Filter by Payment method (Cash vs Online) or Status (Completed, Preparing, Ready).
  - Search by Customer Name or Token Number.
  - **Print / View Thermal-Style Receipt** for any order.
  - Re-open or delete orders if needed.
- **Export to CSV**:
  - 1-click download of `helcy_stall_sales_[date].csv` ready for Excel or Google Sheets.

### 4. ☁️ Database: Offline-First + Free Firebase Firestore
- **Works 100% Offline with Zero Setup**:
  - Uses browser `LocalStorage` out-of-the-box so it never crashes even if the college campus Wi-Fi drops.
- **Multi-Device Real-Time Cloud Sync (Optional)**:
  - If Helcy and her friends want to use multiple phones simultaneously (e.g. one taking orders at the front counter, another cooking in the back):
  - Go to **Settings (Gear Icon) > Firebase Firestore Cloud Sync**.
  - Paste your free Firebase configuration JSON.
  - The app will automatically sync in real-time across all connected devices using Firestore snapshots!

---

## 🚀 Running the App Locally

```bash
# 1. Install dependencies (already done)
npm install

# 2. Start development server
npm run dev
```

The app will start at `http://localhost:5173`. You can also open the local network URL on a phone connected to the same Wi-Fi!

---

## 🌐 Free 1-Minute Deployment (For Mobile Access at the Event)

You can deploy this site for free in 60 seconds so Helcy can open it directly on her phone browser at the event:

### Option A: Vercel (Recommended)
1. Push this folder to GitHub or run `npx vercel` in terminal.
2. Select default settings (Vite).
3. Get a live URL like `https://helcy-stall.vercel.app`!

### Option B: Netlify
1. Drag and drop the `dist/` folder to [app.netlify.com/drop](https://app.netlify.com/drop).
2. It goes live immediately with a free HTTPS URL.

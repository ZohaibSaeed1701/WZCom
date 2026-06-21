# 📘 WZCOM E-Commerce Analytics Portal - User Manual

This manual provides an overview of the features, architecture, and usage of the **WZCOM E-Commerce Analytics Portal** developed for the SCD Lab-13 Final Project.

---

## 💻 1. System Requirements & Installation

The application runs on a local Django backend serving a lightweight SQLite database and a vanilla responsive HTML5/CSS3/JavaScript frontend.

### Prerequisites
- Python 3.10+
- Django 5.0+ or 6.0+
- Pandas (for data manipulation)
- django-cors-headers

### Installation & Run Steps
1. **Activate the Virtual Environment**:
   ```bash
   source venv/bin/activate
   ```
2. **Navigate to the Project Root**:
   ```bash
   cd wzcom
   ```
3. **Pre-populate the SQLite Database (First Run)**:
   This imports the `global_ecommerce_sales.csv` entries into the database.
   ```bash
   python manage.py load_data
   ```
4. **Boot up the Server**:
   ```bash
   python manage.py runserver
   ```
5. **Open in Browser**:
   Open [http://localhost:8000/](http://localhost:8000/) in your web browser.

---

## 🧭 2. Page Navigation & Layout

The system features a fixed left-side navigation sidebar. You can switch pages dynamically without reloading:

1. **Dashboard Overview**: Displays overall performance indicators (KPIs), AI insights, and high-value orders list.
2. **Visual Analysis**: Interactive charts showing category comparisons, segment splits, time trends, discount analysis, and scatter plots.
3. **Data Explorer**: The central database table viewer with CRUD actions (Create, Read, Update, Delete) and search/sort utilities.
4. **User Profile**: Session login, registration, and logout capabilities.

> [!TIP]
> **Theme Customization (Dark/Light Toggle)**:
> In the top header bar, you will find a Sun/Moon icon button. Clicking this button dynamically toggles the interface between a sleek Dark Slate (Obsidian) theme and a clean Light Slate theme. All charts automatically re-animate and adjust their text, grid line, and legend colors to ensure readability on the active background. Your theme preference is cached in the browser's local storage and persists across sessions.


---

## 🔑 3. User Authentication

To perform any database modifications (Add, Edit, or Delete records), you must authenticate:
- Click the **Login** button in the header or navigate to the **User Profile** tab.
- Enter credentials:
  - **Username**: `admin`
  - **Password**: `adminadmin`
- Alternatively, you can use the **Register** tab to create a new profile.
- A **User Badge** in the sidebar footer will display your credentials and active role.

---

## 📊 4. Interactive Visualizations (5 Required Charts)

Navigate to the **Visual Analysis** tab to view the data plots:
*   **Global Filter Panel**: Select options for Region, Category, Customer Segment, or Payment Method to instantly redraw all charts based on your subset of interest.
*   **Monthly Performance Trend** (Line Chart): Track sales and profits over months to identify cyclical peaks and growth rates.
*   **Sales & Profit by Category** (Double Bar Chart): Compares unit performance across Technology, Office Supplies, Furniture, and Clothing & Accessories.
*   **Customer Segment Share** (Pie Chart): Breakdown of order counts among Consumer, Corporate, and Home Office segments.
*   **Discount Frequency** (Histogram Chart): Displays how pricing discounts are distributed among sales records.
*   **Sales vs. Quantity Correlation** (Scatter Plot): Plots sales amount against purchased quantities to help visualize purchase volume trends.

---

## 📝 5. Data Explorer & CRUD Operations

The **Data Explorer** tab is a full data administration portal:
- **Search**: Type in the top search bar to dynamically scan customer names, products, or order numbers.
- **Sorting**: Select sorting criteria (Sales, Profit, Quantity, Date) and toggle the direction (Ascending / Descending).
- **Pagination**: Navigate pages using the Prev/Next buttons. Change entries count per page using the dropdown.
- **Add Record**: Click "+ Add New Record" (requires Login) to open a modal form. The modal recalculates estimated total sales and profit margins dynamically.
- **Edit Record**: Click the teal edit button on any row. The primary Order ID is locked, but you can alter dates, segments, item prices, or discounts.
- **Delete Record**: Click the red trash button to delete an entry with an safety confirm alert.

---

## 📁 6. Data Reporting & Exporting

Two export options are available in the **Data Explorer** tab:
1. **Export CSV**: Downloads a spreadsheet (`.csv` format) containing the exact set of rows current filters display.
2. **Print Report**: Opens a printer-friendly layout of the dashboard overview and metrics tables optimized for printing or exporting directly to **PDF format**.

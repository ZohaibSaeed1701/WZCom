# WZCom 📊

E-Commerce Analytics Portal - Data Explorer and Insight Generation Web Application developed for the Software Construction and Development (SCD) Lab-13 Final Project.

---

## 🚀 How to Clone and Run the Project

Follow these step-by-step instructions to get the application running on your local machine:

### 📋 1. Prerequisites
Ensure you have the following installed:
- Python 3.10+
- Git

---

### 📥 2. Step 1: Clone the Repository
Clone the repository using Git and navigate to the project directory:
```bash
git clone https://github.com/ZohaibSaeed1701/WZCom.git
cd WZCom
```

---

### 🛠️ 3. Step 2: Virtual Environment Setup
1. **Create a Virtual Environment**:
   ```bash
   python3 -m venv venv
   ```
2. **Activate the Virtual Environment**:
   - **macOS / Linux**:
     ```bash
     source venv/bin/activate
     ```
   - **Windows (Command Prompt)**:
     ```cmd
     venv\Scripts\activate
     ```
   - **Windows (PowerShell)**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
3. **Install Dependencies**:
   ```bash
   pip install django django-cors-headers pandas
   ```

---

### 💾 4. Step 3: Database & Migration Configuration
1. **Navigate to the Django Project Folder**:
   ```bash
   cd wzcom
   ```
2. **Run System Migrations**:
   This generates the local SQLite database schema.
   ```bash
   python manage.py migrate
   ```
3. **Load the Dataset**:
   This custom script reads `global_ecommerce_sales.csv` and imports all 2,000 entries into the SQLite database.
   ```bash
   python manage.py load_data
   ```

---

### 🔌 5. Step 4: Run the Development Server
Start the local Django server:
```bash
python manage.py runserver
```

Open [http://127.0.0.1:8000/](http://127.0.0.1:8000/) in your web browser.

---

## 🔑 Default Administrator Credentials
To access data mutation (CRUD actions like Add, Edit, Delete), log in via the **User Profile** page or the **Login** button:
- **Username**: `admin`
- **Password**: `adminadmin`

---

## 🧭 Page Views & Layout
- **Dashboard Overview**: KPI cards, automated insights list, and Top 10 High-Value Orders table.
- **Visual Analysis**: 5 interactive Chart.js widgets (Bar, Pie, Line, Histogram, Scatter) with custom filtering.
- **Data Explorer**: Paginated datatable with filters, search, sorting, CRUD modal, and exports (CSV & printable reports).
- **User Profile**: Session login, registration, and profile details.

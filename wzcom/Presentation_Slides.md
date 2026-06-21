# 📊 WZCOM E-Commerce Analytics Portal - Presentation Slides

Use this outline to copy-paste directly into PowerPoint, Google Slides, or Canva for your final project defense.

---

## Slide 1: Title Slide
*   **Title**: E-Commerce Sales & Profit Analytics Portal
*   **Subtitle**: Data Explorer and Insight Generation Web Application
*   **Course**: Software Construction and Development (SCD) - Lab Final Project
*   **Presenter Name**: [Your Name / Group Number]

---

## Slide 2: Project Overview & Objective
*   **Problem Statement**: Analyzing large e-commerce transaction sets requires structured analytics tools.
*   **Solution**: A full-stack web application designed for data ingestion, visualization, automated insight generation, database CRUD management, and reporting.
*   **Dataset Source**: Kaggle / Sales Datasets (2,000 transactions, 15 relational attributes).

---

## Slide 3: System Architecture & Technologies
*   **Backend Framework**: Django 6.0 / Python (running inside a isolated `venv` virtual environment).
*   **Database Engine**: SQLite3 (relational, pre-populated with sales data).
*   **Frontend Design**: HTML5, Vanilla CSS3 (Glassmorphism layout, Neon Purple/Teal accents, Dark theme), JavaScript.
*   **Visualization Engine**: Chart.js (interactive client-side canvas graphs).

---

## Slide 4: Key Modules & Requirements (Part 1)
*   **User Management**:
    *   Secure User Signup, Login, and Session checking.
    *   Sidebar footer User Badge displaying login roles and access level.
*   **Dataset Module (CRUD)**:
    *   SQLite relational storage.
    *   Fully integrated form views to Create, Read, Update, and Delete transactions.
    *   Self-calculating profit equations computed on input change.

---

## Slide 5: Key Modules & Requirements (Part 2)
*   **Search, Filter & Sorting**:
    *   Global search scans customer names, product names, and order numbers.
    *   Granular filter options: Region, Product Category, Segment, Payment method, and Dates.
    *   Advanced sorting (Ascending/Descending) based on sales or profit volumes.
*   **Reporting Module**:
    *   Filtered entries exportable directly to CSV spreadsheet.
    *   HTML Print-CSS engine to save report states as PDF documents.

---

## Slide 6: Visualizations (5 Interactive Charts)
Demonstration of Chart.js graphs mapping:
1.  **Line Chart**: Monthly Sales & Profit performance trends.
2.  **Bar Chart**: Product Category sales comparison.
3.  **Pie Chart**: Customer Segment split (Consumer, Corporate, Home Office).
4.  **Histogram**: Pricing Discount distribution frequency.
5.  **Scatter Plot**: Order Quantity vs. Total Sales correlation.

---

## Slide 7: Automated Insight Generation
*   **Dynamic Analytics**: The portal calculates and renders text insights in real-time.
*   **Generated Insights Examples**:
    *   *Top Category*: "Furniture is the top product category, generating 52.9% of sales."
    *   *Region Analysis*: "Europe is the most profitable region, producing 28.7% of profits."
    *   *Discount Impact*: "Discount-free orders generate higher average profit margins than discounted ones."
    *   *Payment Selection*: "Credit Card is the most utilized payment method (39.9% of orders)."

---

## Slide 8: Key Development Features
*   **Clean Separation of Concerns**: REST APIs separated from frontend render templates.
*   **Performance Optimization**: SQLite bulk operations for database loading; local state caching for filters.
*   **Sleek Aesthetics**: Modern, responsive dark mode design with glassmorphic cards and soft micro-animations.

---

## Slide 9: Conclusion & Q&A
*   **Project Summary**: Achieved a complete data exploration and analytics portal conforming to all Lab-13 parameters.
*   **Questions**: Open for questions and feedback.

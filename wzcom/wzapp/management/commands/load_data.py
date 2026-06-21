import os
import csv
from datetime import datetime
from django.core.management.base import BaseCommand
from wzapp.models import Order

class Command(BaseCommand):
    help = "Loads e-commerce sales dataset from global_ecommerce_sales.csv into SQLite"

    def handle(self, *args, **options):
        # Path to the CSV file
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        # Since wzapp/management/commands/load_data.py is nested:
        # __file__ is load_data.py
        # parent 1: commands/
        # parent 2: management/
        # parent 3: wzapp/
        # parent 4: wzcom/ (project root)
        # So we look one directory up from the project root:
        csv_path = os.path.join(os.path.dirname(base_dir), 'global_ecommerce_sales.csv')

        self.stdout.write(self.style.NOTICE(f"Looking for CSV at: {csv_path}"))

        if not os.path.exists(csv_path):
            self.stdout.write(self.style.ERROR(f"CSV file not found at {csv_path}"))
            return

        # Clean existing records first to avoid duplicates
        self.stdout.write(self.style.NOTICE("Clearing old records from the database..."))
        Order.objects.all().delete()

        orders_to_create = []
        
        with open(csv_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                # Convert date from YYYY-MM-DD to date object
                try:
                    date_obj = datetime.strptime(row['Order_Date'].strip(), '%Y-%m-%d').date()
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"Invalid date format: {row['Order_Date']}. Error: {e}"))
                    continue

                order = Order(
                    order_id=row['Order_ID'].strip(),
                    order_date=date_obj,
                    customer_name=row['Customer_Name'].strip(),
                    customer_segment=row['Customer_Segment'].strip(),
                    country=row['Country'].strip(),
                    region=row['Region'].strip(),
                    product_category=row['Product_Category'].strip(),
                    product_name=row['Product_Name'].strip(),
                    quantity=int(row['Quantity']),
                    unit_price=float(row['Unit_Price']),
                    discount_percent=int(row['Discount_Percent']),
                    total_sales=float(row['Total_Sales']),
                    shipping_cost=float(row['Shipping_Cost']),
                    profit=float(row['Profit']),
                    payment_method=row['Payment_Method'].strip()
                )
                orders_to_create.append(order)
                count += 1

        # Bulk create for efficiency
        self.stdout.write(self.style.NOTICE(f"Bulk importing {count} records..."))
        Order.objects.bulk_create(orders_to_create)
        self.stdout.write(self.style.SUCCESS("Data imported successfully!"))

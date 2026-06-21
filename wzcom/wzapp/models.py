from django.db import models

class Order(models.Model):
    order_id = models.CharField(max_length=50, unique=True)
    order_date = models.DateField()
    customer_name = models.CharField(max_length=150)
    customer_segment = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    region = models.CharField(max_length=100)
    product_category = models.CharField(max_length=150)
    product_name = models.CharField(max_length=250)
    quantity = models.IntegerField()
    unit_price = models.FloatField()
    discount_percent = models.IntegerField()
    total_sales = models.FloatField()
    shipping_cost = models.FloatField()
    profit = models.FloatField()
    payment_method = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.order_id} - {self.customer_name}"


import json
import csv
from datetime import datetime
from django.shortcuts import render
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db.models import Q, Sum, Avg, Max, Min, Count
from django.db.models.functions import ExtractMonth, ExtractYear
from wzapp.models import Order

# Helper function to apply search and filters
def get_filtered_queryset(request):
    qs = Order.objects.all()

    # Search (customer name, product name, order ID)
    search = request.GET.get('search', '').strip()
    if search:
        qs = qs.filter(
            Q(customer_name__icontains=search) |
            Q(product_name__icontains=search) |
            Q(order_id__icontains=search)
        )

    # Filters
    region = request.GET.get('region', '').strip()
    if region:
        qs = qs.filter(region__iexact=region)

    category = request.GET.get('category', '').strip()
    if category:
        qs = qs.filter(product_category__iexact=category)

    segment = request.GET.get('segment', '').strip()
    if segment:
        qs = qs.filter(customer_segment__iexact=segment)

    payment = request.GET.get('payment', '').strip()
    if payment:
        qs = qs.filter(payment_method__iexact=payment)

    date_from = request.GET.get('date_from', '').strip()
    if date_from:
        try:
            qs = qs.filter(order_date__gte=date_from)
        except ValueError:
            pass

    date_to = request.GET.get('date_to', '').strip()
    if date_to:
        try:
            qs = qs.filter(order_date__lte=date_to)
        except ValueError:
            pass

    # Sorting
    sort_by = request.GET.get('sort_by', 'order_date').strip()
    sort_order = request.GET.get('sort_order', 'desc').strip()

    valid_sort_fields = [
        'order_id', 'order_date', 'customer_name', 'total_sales', 
        'profit', 'quantity', 'unit_price', 'shipping_cost'
    ]
    if sort_by not in valid_sort_fields:
        sort_by = 'order_date'

    if sort_order == 'desc':
        qs = qs.order_by(f'-{sort_by}')
    else:
        qs = qs.order_by(sort_by)

    return qs

# --- User Management Views ---

@csrf_exempt
def api_register(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST method required'}, status=405)
    try:
        data = json.loads(request.body)
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        email = data.get('email', '').strip()

        if not username or not password:
            return JsonResponse({'error': 'Username and password are required'}, status=400)

        if User.objects.filter(username=username).exists():
            return JsonResponse({'error': 'Username already exists'}, status=400)

        user = User.objects.create_user(username=username, email=email, password=password)
        login(request, user)
        return JsonResponse({
            'success': True,
            'user': {'username': user.username, 'email': user.email}
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def api_login(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST method required'}, status=405)
    try:
        data = json.loads(request.body)
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()

        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return JsonResponse({
                'success': True,
                'user': {'username': user.username, 'email': user.email}
            })
            
        return JsonResponse({'error': 'Invalid credentials'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def api_logout(request):
    logout(request)
    return JsonResponse({'success': True})

def api_profile(request):
    if request.user.is_authenticated:
        return JsonResponse({
            'authenticated': True,
            'user': {'username': request.user.username, 'email': request.user.email}
        })
    return JsonResponse({'authenticated': False, 'error': 'Not logged in'}, status=401)

# --- Dataset CRUD Operations ---

@csrf_exempt
def api_orders(request):
    # GET: List orders with filters & pagination
    if request.method == 'GET':
        qs = get_filtered_queryset(request)
        total_count = qs.count()

        # Pagination
        try:
            page = int(request.GET.get('page', 1))
            per_page = int(request.GET.get('per_page', 10))
        except ValueError:
            page = 1
            per_page = 10

        start = (page - 1) * per_page
        end = start + per_page
        orders_page = qs[start:end]

        data = []
        for o in orders_page:
            data.append({
                'id': o.id,
                'order_id': o.order_id,
                'order_date': o.order_date.strftime('%Y-%m-%d'),
                'customer_name': o.customer_name,
                'customer_segment': o.customer_segment,
                'country': o.country,
                'region': o.region,
                'product_category': o.product_category,
                'product_name': o.product_name,
                'quantity': o.quantity,
                'unit_price': o.unit_price,
                'discount_percent': o.discount_percent,
                'total_sales': round(o.total_sales, 2),
                'shipping_cost': round(o.shipping_cost, 2),
                'profit': round(o.profit, 2),
                'payment_method': o.payment_method
            })

        total_pages = (total_count + per_page - 1) // per_page if total_count > 0 else 1

        return JsonResponse({
            'orders': data,
            'total_count': total_count,
            'page': page,
            'per_page': per_page,
            'total_pages': total_pages
        })

    # POST: Create a new order entry
    elif request.method == 'POST':
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        try:
            data = json.loads(request.body)
            # Validation
            req_fields = [
                'order_id', 'order_date', 'customer_name', 'customer_segment', 
                'country', 'region', 'product_category', 'product_name', 
                'quantity', 'unit_price', 'discount_percent', 'shipping_cost', 
                'payment_method'
            ]
            for f in req_fields:
                if f not in data or data[f] == '':
                    return JsonResponse({'error': f"Field '{f}' is required"}, status=400)

            # Check duplicate order_id
            if Order.objects.filter(order_id=data['order_id'].strip()).exists():
                return JsonResponse({'error': 'Order ID already exists'}, status=400)

            qty = int(data['quantity'])
            price = float(data['unit_price'])
            disc = int(data['discount_percent'])
            shipping = float(data['shipping_cost'])

            # Automatically compute Total Sales and Profit
            # Total Sales = (quantity * unit_price) * (1 - discount/100)
            sales = qty * price * (1 - disc / 100.0)
            
            # Simple profit model: Profit = Sales - Shipping Cost - Cost (Assume Cost is 60% of unit price)
            cost = qty * price * 0.60
            profit = sales - shipping - cost

            order = Order.objects.create(
                order_id=data['order_id'].strip(),
                order_date=datetime.strptime(data['order_date'], '%Y-%m-%d').date(),
                customer_name=data['customer_name'].strip(),
                customer_segment=data['customer_segment'].strip(),
                country=data['country'].strip(),
                region=data['region'].strip(),
                product_category=data['product_category'].strip(),
                product_name=data['product_name'].strip(),
                quantity=qty,
                unit_price=price,
                discount_percent=disc,
                total_sales=round(sales, 2),
                shipping_cost=round(shipping, 2),
                profit=round(profit, 2),
                payment_method=data['payment_method'].strip()
            )

            return JsonResponse({
                'success': True,
                'message': 'Order created successfully',
                'id': order.id
            })
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
def api_order_detail(request, pk):
    try:
        order = Order.objects.get(pk=pk)
    except Order.DoesNotExist:
        return JsonResponse({'error': 'Order not found'}, status=404)

    # PUT: Edit record
    if request.method == 'PUT':
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        try:
            data = json.loads(request.body)
            # Update fields
            order.order_date = datetime.strptime(data['order_date'], '%Y-%m-%d').date()
            order.customer_name = data['customer_name'].strip()
            order.customer_segment = data['customer_segment'].strip()
            order.country = data['country'].strip()
            order.region = data['region'].strip()
            order.product_category = data['product_category'].strip()
            order.product_name = data['product_name'].strip()
            order.quantity = int(data['quantity'])
            order.unit_price = float(data['unit_price'])
            order.discount_percent = int(data['discount_percent'])
            order.shipping_cost = float(data['shipping_cost'])
            order.payment_method = data['payment_method'].strip()

            # Recalculate
            order.total_sales = order.quantity * order.unit_price * (1 - order.discount_percent / 100.0)
            cost = order.quantity * order.unit_price * 0.60
            order.profit = order.total_sales - order.shipping_cost - cost

            order.total_sales = round(order.total_sales, 2)
            order.profit = round(order.profit, 2)

            order.save()
            return JsonResponse({'success': True, 'message': 'Order updated successfully'})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    # DELETE: Delete record
    elif request.method == 'DELETE':
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        order.delete()
        return JsonResponse({'success': True, 'message': 'Order deleted successfully'})

    return JsonResponse({'error': 'Method not allowed'}, status=405)

# --- Statistics and Charts APIs ---

def api_stats(request):
    qs = get_filtered_queryset(request)
    aggregates = qs.aggregate(
        sum_sales=Sum('total_sales'),
        sum_profit=Sum('profit'),
        sum_qty=Sum('quantity'),
        avg_disc=Avg('discount_percent'),
        max_s=Max('total_sales'),
        min_s=Min('total_sales'),
        cnt=Count('id')
    )

    return JsonResponse({
        'total_sales': round(aggregates['sum_sales'] or 0, 2),
        'total_profit': round(aggregates['sum_profit'] or 0, 2),
        'total_quantity': aggregates['sum_qty'] or 0,
        'avg_discount': round(aggregates['avg_disc'] or 0, 2),
        'max_sale': round(aggregates['max_s'] or 0, 2),
        'min_sale': round(aggregates['min_s'] or 0, 2),
        'orders_count': aggregates['cnt'] or 0
    })

def api_charts(request):
    qs = get_filtered_queryset(request)

    # 1. Bar Chart: Sales & Profit by Category
    bar_data = qs.values('product_category').annotate(
        sales=Sum('total_sales'),
        profit=Sum('profit')
    ).order_by('-sales')
    
    categories = [b['product_category'] for b in bar_data]
    category_sales = [round(b['sales'] or 0, 2) for b in bar_data]
    category_profits = [round(b['profit'] or 0, 2) for b in bar_data]

    # 2. Pie Chart: Customer Segment Distribution
    pie_data = qs.values('customer_segment').annotate(count=Count('id')).order_by('-count')
    segments = [p['customer_segment'] for p in pie_data]
    segment_counts = [p['count'] for p in pie_data]

    # 3. Line Chart: Monthly Sales & Profit
    # Annotate with Month and Year
    line_data = qs.annotate(
        year=ExtractYear('order_date'),
        month=ExtractMonth('order_date')
    ).values('year', 'month').annotate(
        sales=Sum('total_sales'),
        profit=Sum('profit')
    ).order_by('year', 'month')

    months_labels = []
    month_sales = []
    month_profits = []

    # Map month numbers to readable labels e.g. "Jan 2023"
    month_names = {
        1: 'Jan', 2: 'Feb', 3: 'Mar', 4: 'Apr', 5: 'May', 6: 'Jun',
        7: 'Jul', 8: 'Aug', 9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dec'
    }

    for l in line_data:
        label = f"{month_names.get(l['month'], '')} {l['year']}"
        months_labels.append(label)
        month_sales.append(round(l['sales'] or 0, 2))
        month_profits.append(round(l['profit'] or 0, 2))

    # 4. Histogram: Discount Percentages
    hist_data = qs.values('discount_percent').annotate(count=Count('id')).order_by('discount_percent')
    discounts = [f"{h['discount_percent']}%" for h in hist_data]
    discount_counts = [h['count'] for h in hist_data]

    # 5. Scatter Plot: Quantity vs. Total Sales (Sampled to top 250 points to make it super fast to render)
    scatter_qs = qs.values('quantity', 'total_sales', 'profit', 'product_name')[:250]
    scatter_points = []
    for s in scatter_qs:
        scatter_points.append({
            'x': s['quantity'],
            'y': round(s['total_sales'], 2),
            'profit': round(s['profit'], 2),
            'product': s['product_name']
        })

    return JsonResponse({
        'bar': {
            'labels': categories,
            'sales': category_sales,
            'profit': category_profits
        },
        'pie': {
            'labels': segments,
            'values': segment_counts
        },
        'line': {
            'labels': months_labels,
            'sales': month_sales,
            'profit': month_profits
        },
        'histogram': {
            'labels': discounts,
            'values': discount_counts
        },
        'scatter': scatter_points
    })

# --- Insight Generation Module ---

def api_insights(request):
    qs = get_filtered_queryset(request)
    total_count = qs.count()
    if total_count == 0:
        return JsonResponse({'insights': ['No data matches current filters.']})

    insights = []

    # 1. Best Performing Product Category (Sales)
    cat_sales = qs.values('product_category').annotate(sales=Sum('total_sales')).order_by('-sales')
    if cat_sales.exists():
        top_cat = cat_sales[0]
        total_sales_all = sum(c['sales'] or 0 for c in cat_sales)
        pct = (top_cat['sales'] / total_sales_all * 100) if total_sales_all > 0 else 0
        insights.append(
            f"**{top_cat['product_category']}** is the highest performing product category, "
            f"generating **${top_cat['sales']:,.2f}** which accounts for **{pct:.1f}%** of total sales."
        )

    # 2. Regional Profitability
    reg_profit = qs.values('region').annotate(profit=Sum('profit')).order_by('-profit')
    if reg_profit.exists():
        top_reg = reg_profit[0]
        total_profit_all = sum(r['profit'] or 0 for r in reg_profit)
        pct = (top_reg['profit'] / total_profit_all * 100) if total_profit_all > 0 else 0
        insights.append(
            f"**{top_reg['region']}** is the most profitable region, producing "
            f"**${top_reg['profit']:,.2f}** in net profit (**{pct:.1f}%** of global profit)."
        )

    # 3. Customer Segment and Orders
    seg_data = qs.values('customer_segment').annotate(orders=Count('id'), sales=Sum('total_sales')).order_by('-orders')
    if seg_data.exists():
        top_seg = seg_data[0]
        insights.append(
            f"The **{top_seg['customer_segment']}** segment registered the highest order volume "
            f"with **{top_seg['orders']}** orders, totaling **${top_seg['sales']:,.2f}** in gross sales."
        )

    # 4. Average Profit Margins and Discounts
    disc_data = qs.filter(discount_percent__gt=0).aggregate(
        avg_disc_profit=Avg('profit'),
        avg_disc_sales=Avg('total_sales')
    )
    no_disc_data = qs.filter(discount_percent=0).aggregate(
        avg_no_disc_profit=Avg('profit'),
        avg_no_disc_sales=Avg('total_sales')
    )

    avg_d_prof = disc_data['avg_disc_profit'] or 0
    avg_nd_prof = no_disc_data['avg_no_disc_profit'] or 0

    if avg_nd_prof > avg_d_prof:
        diff = avg_nd_prof - avg_d_prof
        insights.append(
            f"Discount analysis shows orders with *no discount* yield an average profit of "
            f"**${avg_nd_prof:.2f}**, which is **${diff:.2f} higher** than discounted orders (**${avg_d_prof:.2f}**)."
        )

    # 5. Payment Methods
    pay_data = qs.values('payment_method').annotate(count=Count('id')).order_by('-count')
    if pay_data.exists():
        top_pay = pay_data[0]
        pct = (top_pay['count'] / total_count * 100) if total_count > 0 else 0
        insights.append(
            f"**{top_pay['payment_method']}** is the most preferred payment method, "
            f"utilized in **{pct:.1f}%** of all filtered transactions."
        )

    return JsonResponse({'insights': insights})

# --- Reporting & Export APIs ---

def api_export_csv(request):
    qs = get_filtered_queryset(request)
    
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="filtered_ecommerce_sales.csv"'

    writer = csv.writer(response)
    writer.writerow([
        'Order_ID', 'Order_Date', 'Customer_Name', 'Customer_Segment', 
        'Country', 'Region', 'Product_Category', 'Product_Name', 
        'Quantity', 'Unit_Price', 'Discount_Percent', 'Total_Sales', 
        'Shipping_Cost', 'Profit', 'Payment_Method'
    ])

    for o in qs:
        writer.writerow([
            o.order_id, o.order_date.strftime('%Y-%m-%d'), o.customer_name, o.customer_segment,
            o.country, o.region, o.product_category, o.product_name,
            o.quantity, o.unit_price, o.discount_percent, o.total_sales,
            o.shipping_cost, o.profit, o.payment_method
        ])

    return response

def index_view(request):
    return render(request, 'index.html')


from django.urls import path
from wzapp import views

urlpatterns = [
    # Frontend Page
    path('', views.index_view, name='index'),

    # Backend APIs
    path('api/auth/register', views.api_register, name='api_register'),
    path('api/auth/login', views.api_login, name='api_login'),
    path('api/auth/logout', views.api_logout, name='api_logout'),
    path('api/auth/profile', views.api_profile, name='api_profile'),
    
    path('api/orders', views.api_orders, name='api_orders'),
    path('api/orders/<int:pk>', views.api_order_detail, name='api_order_detail'),
    
    path('api/analytics/stats', views.api_stats, name='api_stats'),
    path('api/analytics/charts', views.api_charts, name='api_charts'),
    path('api/analytics/insights', views.api_insights, name='api_insights'),
    
    path('api/export/csv', views.api_export_csv, name='api_export_csv'),
]

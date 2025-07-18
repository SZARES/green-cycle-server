# 🛒 Sistema de Carrito de Compras - Green Cycle

## 📋 **Resumen del Sistema Implementado**

Se ha implementado un sistema completo de carrito de compras persistente con las siguientes características:

### ✅ **Funcionalidades Implementadas:**

1. **Carrito Persistente**
   - Un carrito por usuario guardado en base de datos
   - Se mantiene entre sesiones
   - Actualización automática de precios y disponibilidad

2. **Gestión de Productos**
   - Agregar productos al carrito
   - Actualizar cantidades
   - Eliminar productos
   - Validación de stock en tiempo real

3. **Proceso de Checkout**
   - Creación automática de órdenes (una por vendedor)
   - Sin proceso de pago (acuerdo entre usuarios)
   - Dirección de envío requerida

4. **Panel del Vendedor**
   - Ver órdenes pendientes de aprobación
   - Aprobar o rechazar órdenes
   - Marcar órdenes como enviadas
   - Ver historial de órdenes

5. **Panel del Comprador**
   - Ver estado de sus órdenes
   - Marcar como recibido
   - Cancelar órdenes (si están pendientes)

---

## 🔧 **Endpoints del Carrito**

### **1. Ver Carrito**
```javascript
GET /cart
Authorization: Bearer {token}

Response: {
  userId: "...",
  items: [{
    productId: "...",
    quantity: 2,
    productName: "...",
    unitPrice: 50,
    sellerId: "...",
    sellerName: "..."
  }],
  totalItems: 2,
  totalAmount: 100
}
```

### **2. Agregar al Carrito**
```javascript
POST /cart/add
Authorization: Bearer {token}

Body: {
  productId: "...",
  quantity: 1
}
```

### **3. Actualizar Cantidad**
```javascript
PATCH /cart/item/{productId}
Authorization: Bearer {token}

Body: {
  quantity: 3
}
```

### **4. Eliminar del Carrito**
```javascript
DELETE /cart/item/{productId}
Authorization: Bearer {token}
```

### **5. Limpiar Carrito**
```javascript
DELETE /cart/clear
Authorization: Bearer {token}
```

### **6. Checkout (Procesar Compra)**
```javascript
POST /cart/checkout
Authorization: Bearer {token}

Body: {
  shippingAddress: {
    street: "Av. Principal 123",
    city: "Lima",
    state: "Lima",
    zipCode: "15001",
    country: "Perú"
  },
  notes: "Llamar antes de entregar"
}

Response: [
  {
    orderNumber: "ORD-2024-000001",
    sellerId: "...",
    status: "pending",
    items: [...],
    totalAmount: 100
  }
]
```

---

## 📡 **Endpoints de Órdenes**

### **Para Vendedores:**

#### **Ver Órdenes Pendientes**
```javascript
GET /orders/seller/pending
Authorization: Bearer {token}
```

#### **Ver Todas las Órdenes**
```javascript
GET /orders/seller/all?status=confirmed
Authorization: Bearer {token}
```

#### **Aprobar Orden**
```javascript
PATCH /orders/{orderId}/approve
Authorization: Bearer {token}
```

#### **Rechazar Orden**
```javascript
PATCH /orders/{orderId}/reject
Authorization: Bearer {token}

Body: {
  reason: "Producto agotado"
}
```

#### **Marcar como Enviado**
```javascript
PATCH /orders/{orderId}/ship
Authorization: Bearer {token}

Body: {
  trackingNumber: "TRK123456" // opcional
}
```

### **Para Compradores:**

#### **Ver Mis Órdenes**
```javascript
GET /orders/buyer/all?status=pending
Authorization: Bearer {token}
```

#### **Marcar como Recibido**
```javascript
PATCH /orders/{orderId}/delivered
Authorization: Bearer {token}
```

#### **Cancelar Orden**
```javascript
PATCH /orders/{orderId}/cancel
Authorization: Bearer {token}

Body: {
  reason: "Ya no necesito el producto"
}
```

---

## 💻 **Implementación en Frontend**

### **Ejemplo: Agregar al Carrito**
```javascript
const addToCart = async (productId, quantity = 1) => {
  try {
    const response = await fetch('/cart/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ productId, quantity })
    });
    
    const updatedCart = await response.json();
    console.log('Carrito actualizado:', updatedCart);
  } catch (error) {
    console.error('Error al agregar al carrito:', error);
  }
};
```

### **Ejemplo: Proceso de Checkout**
```javascript
const checkout = async (shippingAddress) => {
  try {
    const response = await fetch('/cart/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ shippingAddress })
    });
    
    const orders = await response.json();
    console.log('Órdenes creadas:', orders);
    // Redirigir a página de confirmación
  } catch (error) {
    console.error('Error en checkout:', error);
  }
};
```

### **Ejemplo: Panel del Vendedor**
```javascript
// Obtener órdenes pendientes
const getPendingOrders = async () => {
  const response = await fetch('/orders/seller/pending', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// Aprobar orden
const approveOrder = async (orderId) => {
  const response = await fetch(`/orders/${orderId}/approve`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

---

## 🔄 **Flujo Completo de Compra**

1. **Usuario navega productos** → Ve catálogo
2. **Agrega al carrito** → `POST /cart/add`
3. **Revisa carrito** → `GET /cart`
4. **Procede al checkout** → `POST /cart/checkout`
5. **Se crean órdenes** → Una orden por cada vendedor
6. **Vendedor ve solicitud** → `GET /orders/seller/pending`
7. **Vendedor aprueba** → `PATCH /orders/{id}/approve`
8. **Negociación** → Chat entre comprador y vendedor
9. **Envío** → `PATCH /orders/{id}/ship`
10. **Confirmación** → `PATCH /orders/{id}/delivered`

---

## 📊 **Estados de una Orden**

```
PENDING → CONFIRMED → PREPARING → SHIPPED → DELIVERED
    ↓         ↓           ↓          ↓
CANCELLED  CANCELLED  CANCELLED   RETURNED
```

- **PENDING**: Esperando aprobación del vendedor
- **CONFIRMED**: Vendedor aprobó, negociando detalles
- **PREPARING**: Preparando envío
- **SHIPPED**: En camino
- **DELIVERED**: Entregado
- **CANCELLED**: Cancelado
- **RETURNED**: Devuelto

---

## 🎯 **Próximos Pasos Sugeridos**

1. **Notificaciones en tiempo real** cuando una orden es aprobada/rechazada
2. **Sistema de calificaciones** post-venta
3. **Historial de transacciones**
4. **Integración con métodos de pago** cuando se decida implementar
5. **Sistema de disputas** para problemas en transacciones

---

## 📝 **Notas Importantes**

- El carrito se limpia automáticamente después del checkout
- Los precios y disponibilidad se actualizan al consultar el carrito
- No hay límite de tiempo para el carrito (no expira)
- Los vendedores deben aprobar TODAS las compras antes de proceder
- El acuerdo de pago/intercambio se realiza por chat entre usuarios 
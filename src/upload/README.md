# Servicio de Upload de Imágenes

Este módulo maneja la subida y gestión de imágenes para los productos de Green Cycle.

## Configuración

### Variables de Entorno Requeridas

```env
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

## Endpoints Disponibles

### 1. Subir Múltiples Imágenes
**POST** `/upload/images`

Sube hasta 10 imágenes a Cloudinary.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Body:**
```
images: File[] (máximo 10 archivos, 5MB cada uno)
```

**Respuesta:**
```json
{
  "success": true,
  "message": "3 imagen(es) subida(s) exitosamente",
  "imageUrls": [
    "https://res.cloudinary.com/.../image1.jpg",
    "https://res.cloudinary.com/.../image2.jpg",
    "https://res.cloudinary.com/.../image3.jpg"
  ],
  "uploadedBy": "user_id",
  "uploadedAt": "2024-01-15T10:30:00.000Z"
}
```

### 2. Subir Una Imagen
**POST** `/upload/image`

Sube una sola imagen a Cloudinary.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Body:**
```
image: File (máximo 5MB)
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Imagen subida exitosamente",
  "imageUrl": "https://res.cloudinary.com/.../image.jpg",
  "uploadedBy": "user_id",
  "uploadedAt": "2024-01-15T10:30:00.000Z"
}
```

### 3. Eliminar Una Imagen
**DELETE** `/upload/image/:publicId`

Elimina una imagen específica de Cloudinary.

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Imagen eliminada exitosamente",
  "deletedBy": "user_id",
  "deletedAt": "2024-01-15T10:30:00.000Z"
}
```

### 4. Eliminar Múltiples Imágenes
**DELETE** `/upload/images`

Elimina múltiples imágenes de Cloudinary.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "publicIds": ["public_id_1", "public_id_2", "public_id_3"]
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "3 imagen(es) eliminada(s) exitosamente",
  "deletedBy": "user_id",
  "deletedAt": "2024-01-15T10:30:00.000Z"
}
```

## Endpoint Integrado para Productos

### Crear Producto con Imágenes
**POST** `/products/with-images`

Crea un producto y sube las imágenes en un solo paso.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Body:**
```
// Datos del producto (JSON string)
{
  "name": "Producto Eco",
  "description": "Descripción del producto",
  "slug": "producto-eco-123",
  "category": "507f1f77bcf86cd799439011",
  "condition": "new",
  "price": 150.00,
  "location": {
    "city": "Lima",
    "region": "Lima"
  }
}

// Imágenes
images: File[] (máximo 10 archivos, 5MB cada uno)
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Producto creado exitosamente con imágenes",
  "product": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Producto Eco",
    "images": [
      "https://res.cloudinary.com/.../image1.jpg",
      "https://res.cloudinary.com/.../image2.jpg"
    ],
    // ... resto de datos del producto
  },
  "uploadedImages": 2
}
```

## Validaciones

- **Tipos de archivo:** Solo imágenes (jpg, png, gif, webp, etc.)
- **Tamaño máximo:** 5MB por archivo
- **Cantidad máxima:** 10 imágenes por producto
- **Autenticación:** Requiere token JWT válido

## Características

- **Optimización automática:** Las imágenes se redimensionan a 800x600px
- **Formato automático:** Se convierte al formato más eficiente
- **Organización:** Las imágenes se guardan en la carpeta `green-cycle/products`
- **Limpieza automática:** Si falla la creación del producto, se eliminan las imágenes subidas
- **Validación de URLs:** Verifica que las imágenes sean de Cloudinary

## Uso en Frontend

```javascript
// Ejemplo de uso con FormData
const formData = new FormData();
formData.append('name', 'Producto Eco');
formData.append('description', 'Descripción del producto');
formData.append('slug', 'producto-eco-123');
formData.append('category', '507f1f77bcf86cd799439011');
formData.append('condition', 'new');
formData.append('price', '150.00');
formData.append('location', JSON.stringify({
  city: 'Lima',
  region: 'Lima'
}));

// Agregar imágenes
imageFiles.forEach(file => {
  formData.append('images', file);
});

const response = await fetch('/products/with-images', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
``` 
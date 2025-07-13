# 🚀 Guía de Implementación del Servicio de Imágenes - Frontend

## 📋 **Resumen del Servicio Implementado**

Se ha creado un servicio completo de manejo de imágenes para los productos de Green Cycle con las siguientes características:

### ✅ **Funcionalidades Implementadas:**
- ✅ Subida de múltiples imágenes (hasta 10)
- ✅ Subida de imagen individual
- ✅ Eliminación de imágenes
- ✅ Optimización automática de imágenes
- ✅ Integración con Cloudinary
- ✅ Validaciones de seguridad
- ✅ Endpoint integrado para crear productos con imágenes

---

## 🔧 **Configuración Requerida**

### **Variables de Entorno (Backend):**
```env
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

### **Dependencias (Backend):**
```json
{
  "cloudinary": "^2.6.1",
  "nestjs-cloudinary": "^2.1.1",
  "multer": "^2.0.1",
  "@types/multer": "^1.4.13"
}
```

---

## 📡 **Endpoints Disponibles**

### **1. Subir Múltiples Imágenes**
```javascript
POST /upload/images
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body: {
  images: File[] (máximo 10 archivos, 5MB cada uno)
}
```

### **2. Subir Una Imagen**
```javascript
POST /upload/image
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body: {
  image: File (máximo 5MB)
}
```

### **3. Crear Producto con Imágenes (RECOMENDADO)**
```javascript
POST /products/with-images
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body: {
  // Datos del producto + imágenes en un solo request
}
```

---

## 💻 **Implementación en Frontend**

### **Opción 1: Crear Producto con Imágenes (Recomendada)**

```javascript
// Función para crear producto con imágenes en un solo paso
async function createProductWithImages(productData, imageFiles) {
  try {
    const formData = new FormData();
    
    // Agregar datos del producto
    Object.keys(productData).forEach(key => {
      if (typeof productData[key] === 'object') {
        formData.append(key, JSON.stringify(productData[key]));
      } else {
        formData.append(key, productData[key]);
      }
    });
    
    // Agregar imágenes
    imageFiles.forEach(file => {
      formData.append('images', file);
    });
    
    const response = await fetch('http://localhost:3000/products/with-images', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al crear el producto');
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Ejemplo de uso
const productData = {
  name: "Compostera Ecológica",
  description: "Compostera hecha con materiales reciclados",
  slug: "compostera-ecologica-2024",
  category: "507f1f77bcf86cd799439011",
  condition: "new",
  price: 150.00,
  currency: "PEN",
  location: {
    city: "Lima",
    region: "Lima"
  },
  ecoBadges: ["reciclado", "biodegradable"],
  isHandmade: true
};

const imageFiles = [/* array de archivos de imagen */];

createProductWithImages(productData, imageFiles)
  .then(result => {
    console.log('Producto creado:', result.product);
    console.log('Imágenes subidas:', result.uploadedImages);
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

### **Opción 2: Subir Imágenes por Separado**

```javascript
// Función para subir imágenes primero
async function uploadImages(imageFiles) {
  const formData = new FormData();
  imageFiles.forEach(file => {
    formData.append('images', file);
  });

  const response = await fetch('http://localhost:3000/upload/images', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error('Error al subir las imágenes');
  }

  const { imageUrls } = await response.json();
  return imageUrls;
}

// Función para crear producto con URLs de imágenes
async function createProduct(productData) {
  const response = await fetch('http://localhost:3000/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(productData)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error al crear el producto');
  }

  return await response.json();
}

// Función combinada
async function createProductWithImagesSeparate(productData, imageFiles) {
  try {
    // 1. Subir imágenes
    const imageUrls = await uploadImages(imageFiles);
    
    // 2. Crear producto con URLs
    const productWithImages = {
      ...productData,
      images: imageUrls
    };
    
    // 3. Crear producto
    return await createProduct(productWithImages);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
```

---

## 🎨 **Implementación con React**

### **Componente de Formulario de Producto**

```jsx
import React, { useState } from 'react';

const ProductForm = () => {
  const [productData, setProductData] = useState({
    name: '',
    description: '',
    slug: '',
    category: '',
    condition: 'new',
    price: 0,
    location: { city: '', region: '' }
  });
  
  const [imageFiles, setImageFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validaciones
    if (files.length > 10) {
      alert('Máximo 10 imágenes');
      return;
    }
    
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`El archivo ${file.name} es demasiado grande. Máximo 5MB`);
        return;
      }
      
      if (!file.type.includes('image')) {
        alert(`El archivo ${file.name} no es una imagen válida`);
        return;
      }
    });
    
    setImageFiles(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const result = await createProductWithImages(productData, imageFiles);
      alert('Producto creado exitosamente!');
      console.log('Producto:', result.product);
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Nombre del Producto:</label>
        <input
          type="text"
          value={productData.name}
          onChange={(e) => setProductData({...productData, name: e.target.value})}
          required
        />
      </div>
      
      <div>
        <label>Descripción:</label>
        <textarea
          value={productData.description}
          onChange={(e) => setProductData({...productData, description: e.target.value})}
          required
        />
      </div>
      
      <div>
        <label>Imágenes:</label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageChange}
          required
        />
        <small>Máximo 10 imágenes, 5MB cada una</small>
      </div>
      
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Creando producto...' : 'Crear Producto'}
      </button>
    </form>
  );
};

export default ProductForm;
```

---

## 🔍 **Validaciones del Frontend**

```javascript
// Validaciones de imágenes
function validateImages(files) {
  const errors = [];
  
  if (files.length === 0) {
    errors.push('Debe seleccionar al menos una imagen');
  }
  
  if (files.length > 10) {
    errors.push('Máximo 10 imágenes por producto');
  }
  
  files.forEach(file => {
    if (file.size > 5 * 1024 * 1024) {
      errors.push(`El archivo ${file.name} es demasiado grande (máximo 5MB)`);
    }
    
    if (!file.type.includes('image')) {
      errors.push(`El archivo ${file.name} no es una imagen válida`);
    }
  });
  
  return errors;
}

// Validaciones de datos del producto
function validateProductData(data) {
  const errors = [];
  
  if (!data.name || data.name.length < 3) {
    errors.push('El nombre debe tener al menos 3 caracteres');
  }
  
  if (!data.description || data.description.length < 10) {
    errors.push('La descripción debe tener al menos 10 caracteres');
  }
  
  if (!data.category) {
    errors.push('Debe seleccionar una categoría');
  }
  
  if (!data.location.city || !data.location.region) {
    errors.push('Debe completar la ubicación');
  }
  
  return errors;
}
```

---

## 📱 **Ejemplo con Drag & Drop**

```jsx
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const ImageUpload = ({ onImagesSelected }) => {
  const [uploadedImages, setUploadedImages] = useState([]);

  const onDrop = useCallback((acceptedFiles) => {
    const validFiles = acceptedFiles.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`El archivo ${file.name} es demasiado grande`);
        return false;
      }
      return true;
    });

    if (uploadedImages.length + validFiles.length > 10) {
      alert('Máximo 10 imágenes');
      return;
    }

    setUploadedImages(prev => [...prev, ...validFiles]);
    onImagesSelected([...uploadedImages, ...validFiles]);
  }, [uploadedImages, onImagesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 10
  });

  const removeImage = (index) => {
    const newImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(newImages);
    onImagesSelected(newImages);
  };

  return (
    <div>
      <div {...getRootProps()} style={{
        border: '2px dashed #ccc',
        borderRadius: '4px',
        padding: '20px',
        textAlign: 'center',
        cursor: 'pointer'
      }}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Suelta las imágenes aquí...</p>
        ) : (
          <p>Arrastra imágenes aquí o haz clic para seleccionar</p>
        )}
      </div>
      
      {uploadedImages.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h4>Imágenes seleccionadas ({uploadedImages.length}/10):</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {uploadedImages.map((file, index) => (
              <div key={index} style={{ position: 'relative' }}>
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${index}`}
                  style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                />
                <button
                  onClick={() => removeImage(index)}
                  style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    background: 'red',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer'
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
```

---

## 🚨 **Manejo de Errores**

```javascript
// Función mejorada con manejo de errores
async function createProductWithImages(productData, imageFiles) {
  try {
    // Validaciones previas
    const imageErrors = validateImages(imageFiles);
    const productErrors = validateProductData(productData);
    
    if (imageErrors.length > 0 || productErrors.length > 0) {
      throw new Error([...imageErrors, ...productErrors].join('\n'));
    }
    
    const formData = new FormData();
    
    // Agregar datos del producto
    Object.keys(productData).forEach(key => {
      if (typeof productData[key] === 'object') {
        formData.append(key, JSON.stringify(productData[key]));
      } else {
        formData.append(key, productData[key]);
      }
    });
    
    // Agregar imágenes
    imageFiles.forEach(file => {
      formData.append('images', file);
    });
    
    const response = await fetch('http://localhost:3000/products/with-images', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al crear el producto');
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error completo:', error);
    
    // Mostrar error específico al usuario
    if (error.message.includes('Ya existe un producto con ese slug')) {
      throw new Error('Ya existe un producto con ese nombre. Cambia el slug.');
    }
    
    if (error.message.includes('Error al subir')) {
      throw new Error('Error al subir las imágenes. Verifica el tamaño y formato.');
    }
    
    throw new Error('Error inesperado. Intenta nuevamente.');
  }
}
```

---

## 📋 **Checklist de Implementación**

- [ ] Configurar variables de entorno de Cloudinary
- [ ] Instalar dependencias necesarias
- [ ] Implementar componente de selección de imágenes
- [ ] Implementar validaciones de frontend
- [ ] Implementar función de creación de productos
- [ ] Agregar manejo de errores
- [ ] Implementar indicadores de carga
- [ ] Probar con diferentes tipos de archivos
- [ ] Probar con diferentes tamaños de archivos
- [ ] Implementar preview de imágenes
- [ ] Agregar funcionalidad de eliminación de imágenes

---

## 🎯 **Recomendaciones**

1. **Usa el endpoint `/products/with-images`** - Es más eficiente y maneja todo en un solo request
2. **Implementa validaciones en el frontend** - Mejora la experiencia del usuario
3. **Usa indicadores de progreso** - Para subidas de archivos grandes
4. **Implementa preview de imágenes** - Permite al usuario ver las imágenes antes de subir
5. **Maneja errores específicos** - Proporciona mensajes claros al usuario
6. **Usa drag & drop** - Mejora la experiencia de usuario
7. **Implementa compresión de imágenes** - Reduce el tamaño antes de subir

---

**¡El servicio está listo para usar! 🚀** 
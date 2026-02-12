# Configuración de Firebase

## Pasos para configurar Firebase

1. **Crear proyecto en Firebase Console**
   - Ve a https://console.firebase.google.com/
   - Haz clic en "Agregar proyecto"
   - Ingresa un nombre para tu proyecto (ej: "sop-sistema")
   - Sigue los pasos para crear el proyecto

2. **Habilitar Authentication**
   - En el menú lateral, ve a "Authentication"
   - Haz clic en "Comenzar"
   - Selecciona "Email/Password"
   - Habilita "Email/Password" y guarda

3. **Crear usuario de prueba**
   - En Authentication > Users, haz clic en "Agregar usuario"
   - Email: arturo@example.com (o el que prefieras)
   - Contraseña: arturo123
   - Guarda el usuario

4. **Crear base de datos Firestore**
   - En el menú lateral, ve a "Firestore Database"
   - Haz clic en "Crear base de datos"
   - Selecciona "Comenzar en modo de prueba" (para desarrollo)
   - Elige una ubicación (ej: us-central)
   - Haz clic en "Habilitar"

5. **Obtener credenciales de configuración**
   - Ve a Configuración del proyecto (ícono de engranaje)
   - Baja hasta "Tus aplicaciones"
   - Haz clic en el ícono de web (</>)
   - Registra la app con un nombre (ej: "sop-web")
   - Copia las credenciales que aparecen

6. **Configurar variables de entorno**
   - Crea un archivo `.env.local` en la raíz del proyecto
   - Copia el siguiente contenido y reemplaza con tus credenciales:

```
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key_aqui
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
```

## Nota importante

Actualmente, la aplicación usa autenticación simple con localStorage para desarrollo rápido.
Cuando configures Firebase, puedes actualizar el código de login para usar Firebase Authentication.


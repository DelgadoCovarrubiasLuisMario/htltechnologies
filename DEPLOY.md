# Guía de Despliegue - HTL Electronics SLA System

Esta guía te ayudará a desplegar la aplicación en Vercel.

## Opción 1: Despliegue en Vercel (Recomendado)

### Prerrequisitos

1. **Cuenta de Vercel**: Crea una cuenta gratuita en [vercel.com](https://vercel.com)
2. **GitHub/GitLab/Bitbucket**: Necesitas tener el código en un repositorio Git

### Pasos para desplegar

#### 1. Preparar el repositorio Git

```bash
# Si aún no tienes un repositorio Git inicializado
git init
git add .
git commit -m "Initial commit - HTL Electronics SLA System"
git branch -M main

# Conecta con tu repositorio remoto (GitHub, GitLab, etc.)
git remote add origin <URL_DE_TU_REPOSITORIO>
git push -u origin main
```

#### 2. Desplegar en Vercel

**Opción A: Desde la interfaz web de Vercel**

1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. Haz clic en "Add New Project"
3. Conecta tu repositorio Git (GitHub, GitLab o Bitbucket)
4. Selecciona el repositorio del proyecto
5. Vercel detectará automáticamente que es un proyecto Next.js
6. Configuración recomendada:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (raíz del proyecto)
   - **Build Command**: `npm run build` (automático)
   - **Output Directory**: `.next` (automático)
   - **Install Command**: `npm install` (automático)
7. Haz clic en "Deploy"
8. Espera a que termine el despliegue (2-5 minutos)

**Opción B: Desde la línea de comandos**

```bash
# Instala Vercel CLI globalmente
npm i -g vercel

# Inicia sesión en Vercel
vercel login

# Despliega el proyecto
vercel

# Para producción
vercel --prod
```

#### 3. Configurar variables de entorno (si usas Firebase)

Si planeas usar Firebase en producción:

1. En el dashboard de Vercel, ve a tu proyecto
2. Ve a "Settings" > "Environment Variables"
3. Agrega las siguientes variables (si las necesitas):
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`

**Nota**: Actualmente la aplicación usa `localStorage` para autenticación y almacenamiento, por lo que no necesitas configurar Firebase a menos que quieras migrar a Firebase más adelante.

#### 4. Verificar el despliegue

Una vez completado el despliegue:
- Vercel te dará una URL como: `https://tu-proyecto.vercel.app`
- La aplicación debería estar funcionando en esa URL
- Cada vez que hagas `git push` a la rama principal, Vercel desplegará automáticamente

### Actualizaciones futuras

Para actualizar la aplicación:
```bash
git add .
git commit -m "Descripción de los cambios"
git push
```

Vercel detectará automáticamente los cambios y desplegará una nueva versión.

---

## Opción 2: Despliegue manual en servidor propio

Si prefieres usar tu propio servidor:

### Prerrequisitos

- Node.js 18+ instalado
- Servidor con acceso SSH
- Dominio configurado (opcional)

### Pasos

1. **Construir la aplicación**:
```bash
npm run build
```

2. **Iniciar el servidor de producción**:
```bash
npm start
```

3. **Usar PM2 para mantener el proceso activo** (recomendado):
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar la aplicación con PM2
pm2 start npm --name "htl-sla-system" -- start

# Guardar la configuración de PM2
pm2 save

# Configurar PM2 para iniciar al arrancar el servidor
pm2 startup
```

4. **Configurar Nginx como proxy reverso** (opcional pero recomendado):

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Notas importantes

1. **Almacenamiento de datos**: Actualmente la aplicación usa `localStorage` del navegador, lo que significa que los datos se guardan localmente en cada dispositivo. Si necesitas sincronización entre dispositivos, deberás migrar a Firebase Firestore o otra base de datos.

2. **Autenticación**: La autenticación actual es simple (usuario: `arturo`, contraseña: `arturo123`) y se guarda en `localStorage`. Para producción, considera implementar autenticación más segura.

3. **HTTPS**: Vercel proporciona HTTPS automáticamente. Si usas tu propio servidor, configura un certificado SSL (Let's Encrypt es gratuito).

4. **Dominio personalizado**: En Vercel puedes agregar tu propio dominio en "Settings" > "Domains".

---

## Solución de problemas

### Error de build en Vercel
- Verifica que todas las dependencias estén en `package.json`
- Asegúrate de que no haya errores de TypeScript: `npm run build` localmente

### La aplicación no carga
- Verifica que el puerto 3000 esté abierto (si usas servidor propio)
- Revisa los logs en Vercel: Dashboard > Deployments > [tu deployment] > Logs

### Problemas con imágenes
- Asegúrate de que `logo.jpg` esté en la carpeta `public/`
- Verifica la configuración de `next.config.js` para imágenes

---

¿Necesitas ayuda con algún paso específico? ¡Avísame!


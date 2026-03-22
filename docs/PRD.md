# PRD — Bodega Adidas: Sistema de Inventario

---

## 1. Problema que Resuelve

En tiendas y bodegas, hay dos necesidades frecuentes:

**Problema 1 — Tienda:** Los vendedores no saben donde esta un producto en los anaqueles. Deben preguntar o buscar manualmente.

**Problema 2 — Bodega:** Los bodegueros necesitan agregar productos a anaqueles sin un sistema centralizado. Deben recordar o buscar en listas en papel.

**Este producto resuelve:**

- La dificultad para encontrar rapidamente donde esta almacenado un producto
- La falta de control al agregar productos a los anaqueles
- La dependencia de memoria personal que se pierde con rotacion de personal

---

## 2. Usuarios Objetivo y Sus Necesidades

### 2.1 Trabajadores de Tienda (Escaneo Unico)

| Necesidad            | Descripcion                                                           |
| -------------------- | --------------------------------------------------------------------- |
| Busqueda rapida      | Encontrar un producto en segundos usando su codigo de barras o nombre |
| Accesibilidad mobile | Usar desde cualquier dispositivo movil en la tienda                   |
| Interfaz simple      | Operar sin capacitacion extensiva                                     |

**Perfil:** Vendedores y atencion al cliente que necesitan ubicar productos rapido.

### 2.2 Bodegueros (Escaneo Multiple)

| Necesidad            | Descripcion                                          |
| -------------------- | ---------------------------------------------------- |
| Agregar productos    | Escanear y asignar productos a un anaquel especifico |
| Escaneo continuo     | Agregar multiples productos sin repetir pasos        |
| Revision de errores  | Editar o eliminar productos antes de confirmar       |
| Accesibilidad mobile | Usar desde dispositivo movil en la bodega            |
| Interfaz simple      | Operar sin capacitacion extensiva                    |

**Perfil:** Personal de bodega que recibe y organiza productos en anaqueles.

### 2.3 Administradores (Usuarios Secundarios)

| Necesidad             | Descripcion                                                    |
| --------------------- | -------------------------------------------------------------- |
| Gestion de productos  | Agregar, editar, importar productos masivamente                |
| Gestion de anaqueles  | Agregar, Editar, Crear/modificar ubicaciones de almacenamiento |
| Control de inventario | Ver reportes y logs de busqueda                                |

**Perfil:** Encargados de bodega con capacidad de configuracion.

---

## 3. Funcionalidades Principales

### 3.1 Funcionalidades Actuales (v1.0)

| Funcionalidad              | Descripcion                                       | Prioridad |
| -------------------------- | ------------------------------------------------- | --------- |
| Escaneo de codigos         | Camara del dispositivo para leer barcode/QR       | Critica   |
| Busqueda por texto         | Buscar productos por nombre, SKU o referencia     | Critica   |
| Visualizacion de ubicacion | Mostrar anaquel y nivel donde esta el producto    | Critica   |
| Gestion de anaqueles       | CRUD de anaqueles con niveles (ALTO, MEDIO, BAJO) | Alta      |
| Importacion CSV            | Carga masiva de productos desde archivo           | Alta      |
| Autenticacion              | Login con roles (admin/usuario)                   | Alta      |
| PWA                        | Instalable como app en dispositivos moveiles      | Media     |

### 3.2 Modo Batch: Agregar Productos a Anaquel (v1.1)

Permite escanear uno o multiples productos para agregarlos a un anaquel especifico. Es para gestion de inventario, no para busqueda.

**Diferencia clave:**

- **Escaneo unico (tienda)**: Ubicar un producto existente en los anaqueles
- **Escaneo multiple (bodega)**: Agregar productos nuevos o existentes a un anaquel

#### 3.2.1 Flujo del Usuario

```
1. Usuario selecciona anaquel destino (ej: Anaquel A3, Nivel MEDIO)
2. Inicia modo batch (boton "Agregar Productos")
3. Escanea productos con la camara
4. Cada scan se agrega a la lista temporal
5. Al terminar, revisa preview con todos los productos escaneados
6. Puede editar codigos erroneos o eliminar items
7. Confirma y guarda: todos los productos quedan asignados al anaquel
```

#### 3.2.2 Seleccion de Anaquel

| Campo   | Descripcion                                |
| ------- | ------------------------------------------ |
| Anaquel | Selector de anaquel (A1, A2, B1, etc.)     |
| Nivel   | ALTO, MEDIO, BAJO                          |
| Resumen | "X productos seran agregados a A3 - MEDIO" |

#### 3.2.3 Pantalla de Preview

| Elemento          | Descripcion                                                        |
| ----------------- | ------------------------------------------------------------------ |
| Ubicacion destino | Anaquel y nivel seleccionados                                      |
| Lista de escaneos | Todos los codigos leidos con su informacion                        |
| Estado del item   | `correcto` (verde), `no encontrado` (rojo), `duplicado` (amarillo) |
| Boton editar      | Corrige codigo si se leyo mal                                      |
| Boton eliminar    | Quita item de la lista                                             |
| Contador          | "X productos para Anaquel Y3 - MEDIO"                              |
| Boton cancelar    | Descarta todo y vuelve                                             |
| Boton guardar     | Confirma y persiste la asignacion                                  |

#### 3.2.4 Lectura Completa de Etiquetas

El sistema intenta extraer todos los datos disponibles de la etiqueta:

| Campo    | Fuente                           | Requerido |
| -------- | -------------------------------- | --------- |
| barcode  | Codigo de barras principal       | Si        |
| sku      | Campo SKU en etiqueta            | No        |
| nombre   | Nombre del producto              | No        |
| talla    | Talla/tamano                     | No        |
| color    | Color del producto               | No        |
| cantidad | Cantidad en etiqueta (si existe) | No        |

#### 3.2.5 Validaciones en Modo Batch

- **Producto no existe en BD**: Se marca en rojo, permite crear nuevo o ignorar
- **Duplicado**: Alerta visual si el mismo codigo se escanea dos veces
- **Edicion manual**: Si el scan fue incorrecto, el usuario puede escribir el codigo correcto

#### 3.2.6 Estados del Escaneo

| Estado        | Color    | Accion disponible                      |
| ------------- | -------- | -------------------------------------- |
| Correcto      | Verde    | Editar, Eliminar                       |
| No encontrado | Rojo     | Crear producto, Editar codigo, Ignorar |
| Duplicado     | Amarillo | Mantener ambos, Eliminar duplicado     |
| Editado       | Azul     | Ver original vs corregido              |

#### 3.3 Resolucion de Codigos

El sistema busca productos en este orden de prioridad:

1. **barcode** — codigo de barras exacto (scan)
2. **sku** — identificador interno
3. **reference** — referencia alternativa

Todas las busquedas se registran en `scan_logs` para trazabilidad.

---

## 4. Contexto de Uso

### 4.1 Escenario: Busqueda en Tienda (Escaneo Unico)

**Proposito:** Ubicar un producto existente en los anaqueles de la tienda.

```
1. Cliente o vendedor escanea producto
2. Sistema busca en BD y muestra: "Anaquel A3, Nivel MEDIO"
3. Usuario va directamente a la ubicacion
```

### 4.2 Escenario: Agregar Productos a Anaquel (Escaneo Multiple)

**Proposito:** Agregar uno o mas productos a un anaquel especifico (gestion de inventario).

```
1. Bodeguero recibe productos nuevos
2. Selecciona anaquel destino (ej: Anaquel A3, Nivel MEDIO)
3. Escanea producto A -> "Agregado a lista"
4. Escanea producto B -> "Agregado a lista"
5. Escanea producto C -> "Codigo no encontrado" -> edita manualmente
6. Repite hasta escanear todos
7. Revisa preview con todos los productos
8. Confirma: productos quedan asignados al anaquel A3 - MEDIO
```

### 4.3 Escenario: Lectura de Etiqueta Completa

```
1. En modo batch, usuario escanea etiqueta con QR
2. Sistema extrae: barcode, SKU, nombre, talla, color
3. Muestra todos los datos en la lista de preview
4. Si algun campo falta, se puede completar manualmente
5. Al guardar, todos los campos quedan registrados con el anaquel
```

### 4.4 Entorno Operacional

| Factor       | Condicion                                       |
| ------------ | ----------------------------------------------- |
| Dispositivos | Smartphones y tablets (iOS/Android)             |
| Conectividad | Variable — la bodega puede tener zonas sin seal |
| Idioma       | Espanol                                         |
| Horario      | Uso intensivo en turnos de trabajo              |
| Formacion    | Minima — interfaz intuitiva                     |

### 4.5 Limitaciones Conocidas

- No maneja stock/cantidades — solo ubicacion
- No hay sincronizacion offline completa
- Escaneo depende de la camara del dispositivo
- Modo batch no persiste listas intermedias (se pierde si se cierra app)

---

## 5. Roadmap Tentativo (Futuras Funcionalidades)

> Para documentar en issues/cards de planning

### Prioridad Alta (v1.1)

- [x] Modo batch: Escaneo continuo de productos (planificado)
- [ ] Preview de escaneos con edicion/eliminacion
- [ ] Lectura completa de etiquetas (mas campos)
- [ ] Persistencia de listas intermedias en batch

### Prioridad Media

- [ ] Gestion de stock/cantidades por ubicacion
- [ ] Historial de movimientos de productos
- [ ] Transferencias entre anaqueles
- [ ] Reportes de ocupacion de anaqueles

### Prioridad Baja

- [ ] Exportacion de inventario
- [ ] Modo offline completo con sincronizacion
- [ ] Escaneo por voz (hands-free)

---

## 6. Metricas de Exito

### Metricas Busqueda (Tienda)

| Metrica            | Definicion                                   |
| ------------------ | -------------------------------------------- |
| Tiempo de busqueda | Segundos desde scan hasta mostrar ubicacion  |
| Tasa de rescaneo   | Veces que el usuario debe escanear por error |
| Error de ubicacion | Casos donde producto no esta donde se indica |

### Metricas Agregar a Anaquel (Batch)

| Metrica                  | Definicion                                       |
| ------------------------ | ------------------------------------------------ |
| Tiempo promedio por item | Segundos desde scan hasta confirmacion           |
| Tasa de edicion en batch | Porcentaje de items editados del total escaneado |
| Tamano promedio de lista | Productos por sesion de batch                    |
| Tasa de completitud      | Listas guardadas vs abandonadas                  |
| Tasa de productos nuevos | Porcentaje de scans que requieren crear producto |

# Sugerencias De Mejora

Ideas priorizadas para evolucionar el Acuario Virtual 2D Inteligente.

## Interprete local

El chat funciona sin LLM. El interprete debe seguir creciendo con reglas pequenas y verificables, sin ejecutar acciones cuando falten datos.

- Mantener normalizacion de acentos, sinonimos, plurales y cantidades.
- Preguntar especie, cantidad o velocidad cuando el mensaje sea incompleto.
- Mostrar una confirmacion clara para mensajes con varias acciones.
- Agregar pruebas de frases equivalentes antes de incorporar nuevos alias.

## Prioridad Alta

### Inspeccion Por Animal

- Click sobre pez, caracol o gamba para ver especie, edad, hambre, salud, estado y tamano.
- Mostrar si esta vivo, hambriento, en hambruna, muerto o consumiendo alimento natural.
- Mostrar advertencias de compatibilidad por individuo.

### Diagnostico Del Ecosistema

- Comando `diagnostico` con recomendaciones claras.
- Ejemplos: alimentar menos, agregar plantas, limpiar muertos, revisar sobrepoblacion, cambiar velocidad.
- Panel con alertas visuales cuando suban amonio, nitritos o baje oxigeno.

### Cambios De Agua

- Comandos como `cambio de agua 30%`.
- Reducir amonio, nitritos y nitratos.
- Penalizar cambios demasiado grandes por estres.

### Filtro Mas Realista

- Capacidad biologica del filtro segun carga animal.
- Filtro sucio o saturado.
- Comandos: `limpia el filtro`, `mejora el filtro`.

## Prioridad Media

### Tienda E Inventario

- Dinero inicial.
- Precios por peces, invertebrados, plantas, comida y equipos.
- Limitar compras por presupuesto y capacidad biologica.

### Ciclo Dia/Noche

- Plantas producen oxigeno de dia y consumen de noche.
- Exceso de luz favorece algas.
- Comandos para controlar luz: `enciende la luz`, `apaga la luz`.

### Reproduccion Visual

- Huevos o crias visibles.
- Cria con tamano reducido y crecimiento gradual.
- Notificaciones mas claras cuando nace una cria.

### Mejor Render Por Especie

- Sprites simples o siluetas mas realistas por especie.
- Diferenciar claramente betta, angel, guppy, molly, corydora y otocinclus.
- Animaciones de aletas y movimiento por comportamiento.

## Prioridad Baja

### Enfermedades Y Tratamientos

- Riesgo por mala calidad del agua o estres.
- Sintomas: nado lento, perdida de color, no comer.
- Comandos: `trata enfermedades`, `cuarentena`.

### Exportar E Importar Partida

- Comando o boton para exportar `aquarium-state.json`.
- Importar partida para migrar entre Codespaces.

### Log De Eventos

- Historial separado de eventos importantes.
- Nacimientos, muertes, rechazos de compatibilidad, cambios de agua y alertas.

## Comandos Que Conviene Mantener Visibles

- `menu`: arbol maestro.
- `especies`: catalogo disponible.
- `inventario`: habitantes actuales.
- `estado`: calidad del agua.
- `ideas`: ejemplos de acciones.
- `alimentar`: dar comida.
- `agrega un...`: comprar o agregar especies.

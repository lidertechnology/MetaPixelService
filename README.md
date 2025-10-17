# MetaPixelService

Informe de Servicio: MetaPixelService

Este documento describe el servicio unificado MetaPixelService, diseñado para centralizar y estandarizar el rastreo de eventos de Meta Pixel (Facebook Ads) en todas las aplicaciones Angular de Lidertech, en línea con la metodología CiclicModelLider.

El objetivo es asegurar que la medición de eventos (desde vistas de página hasta conversiones complejas) sea consistente, robusta y optimizada para el entorno de las Aplicaciones de Página Única (SPA) como Angular.

1. Estructura y Componentes Clave

El servicio encapsula toda la lógica de la función global fbq(), eliminando la necesidad de interactuar directamente con el script del pixel en los componentes.

Elemento

Descripción

Propósito Lidertech

Interfaces

Tipado estricto para los datos de los eventos (MetaPixelContenido, MetaPixelCompra, etc.).

Garantiza la calidad y consistencia de los datos enviados a Meta.

pixelInicializado (Signal)

Una signal que gestiona el estado de inicialización del Pixel.

Sigue la convención de Lidertech de usar Signals para la gestión de estado interno.

iniciarRastreo()

Función de inicio que verifica si fbq está disponible y llama a rastrearCambiosDeRuta().

Maneja errores de carga si el script no está en index.html.

rastrearCambiosDeRuta()

Se suscribe al Router de Angular, específicamente al evento NavigationEnd. ESENCIAL para SPAs.

Asegura que se dispare un PageView en cada cambio de vista, no solo al cargar la aplicación por primera vez.

2. Guía de Uso: Implementación en Componentes

El servicio ha sido diseñado para ser genérico. El rastreo de PageView es automático; solo necesitas llamar a los métodos de conversión en los momentos clave de interacción del usuario.

Eventos de Contenido y Visibilidad (Visitas a Rutas Clave)

Utiliza este método para registrar cuando un usuario ha visto contenido importante (detalles de productos, artículos de blog, páginas de servicios específicos).

Método

Evento de Meta

Cuándo Usarlo

rastrearContenidoVisto(data)

ViewContent

En el ngOnInit de la página de detalle de un producto, servicio o artículo.

rastrearBusqueda(data)

Search

Después de que el usuario haya ejecutado una búsqueda exitosa en la aplicación.

Ejemplo de Implementación (ngOnInit en un Componente de Detalle):

// En un componente, por ejemplo, LiderMenu
import { Component, inject, OnInit } from '@angular/core';
import { MetaPixelService } from '@lidertech/core'; // Asumiendo que es parte de tu biblioteca

@Component({...})
export class DetalleProductoComponent implements OnInit {
  private pixelService = inject(MetaPixelService);
  // Simulación de datos del producto
  productoId = 'PROD-456';
  nombreProducto = 'Bandeja Paisa Premium';

  ngOnInit(): void {
    this.pixelService.rastrearContenidoVisto({
      content_name: this.nombreProducto,
      content_category: 'LiderMenu_Platos_Fuertes',
      content_ids: [this.productoId],
      content_type: 'product'
    });
  }
}


Eventos de Conversión (Leads y Transacciones)

Estos son los eventos de mayor valor para tus campañas de Meta Ads.

Método

Evento de Meta

Cuándo Usarlo

rastrearInicioDeProceso(data)

InitiateCheckout

Intención: Al hacer clic en un botón clave como "Cotizar", "Iniciar Registro", "Solicitar Demo" o "Añadir al Carrito".

rastrearLeadGenerado(data)

Lead

Conversión Final: Al enviar un formulario de contacto, cotización o solicitud de información con éxito.

rastrearRegistroCompletado(data)

CompleteRegistration

Conversión Final: Inmediatamente después de que el usuario haya completado el flujo de registro.

rastrearCompraExitosa(data)

Purchase

Transacción: En la página de confirmación después de que un pago ha sido procesado con éxito.

Ejemplo de Rastreo de Lead (LiderDirector / LiderConsult):

// En el método de envío de un formulario de contacto
private pixelService = inject(MetaPixelService);

enviarFormulario(): void {
  // Lógica de envío a Firestore o Cloud Function
  
  if (envioExitoso) {
    this.pixelService.rastrearLeadGenerado({
      content_name: 'Lead de Cita Médica',
      content_category: 'LiderConsult_Cita',
      value: 120, // Valor asignado al lead
      currency: 'USD'
    });
    // Mostrar SnackBar de éxito (convención Lidertech)
  }
}


Eventos Personalizados (Flexibilidad)

Para eventos específicos de tu negocio no cubiertos por los estándares (ej. interacción con un video, descarga de un PDF, voto en una encuesta), utiliza el método genérico:

Método

Evento de Meta

Uso

rastrearEventoPersonalizado(nombreEvento, parametros)

trackCustom

Para eventos únicos. Meta lo registrará bajo el nombreEvento proporcionado.

Ejemplo de Evento Personalizado (LiderAcademy):

this.pixelService.rastrearEventoPersonalizado('Descarga_Material_PDF', {
  curso: 'Angular Avanzado',
  usuario_rol: 'Estudiante',
  valor_estimado: 0.50 
});

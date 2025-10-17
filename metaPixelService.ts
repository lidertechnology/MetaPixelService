import { Injectable, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

// Interfaz para el contenido general (ViewContent, AddToCart, etc.)
interface MetaPixelContenido {
  content_name: string;
  content_category?: string;
  content_ids?: string[];
  content_type?: string;
  value?: number;
  currency?: string;
}

// Interfaz para el evento de Búsqueda
interface MetaPixelBusqueda {
  search_string: string;
  content_category?: string;
  num_items?: number;
}

// Interfaz para el evento de Compra
interface MetaPixelCompra extends MetaPixelContenido {
  value: number;
  currency: string;
  num_items?: number;
}

// Declaramos la función global 'fbq' para que TypeScript sepa que existe
declare const fbq: Function;

@Injectable({
  providedIn: 'root'
})
export class MetaPixelService {

  // Almacena el estado de inicialización del Pixel. Usamos Signal aunque este servicio
  // no use reactividad directa, por convención de Lidertech.
  private pixelInicializado = signal(false);

  constructor(private router: Router) {
    this.iniciarRastreo();
  }

  /**
   * Inicializa el rastreo del Pixel y se suscribe a los cambios de ruta.
   */
  private iniciarRastreo(): void {
    if (typeof fbq === 'function' && !this.pixelInicializado()) {
      // El Meta Pixel ID debe estar cargado en el index.html
      this.pixelInicializado.set(true);
      this.rastrearCambiosDeRuta();
    } else {
      console.warn('Meta Pixel no cargado. Verifica el script en index.html.');
    }
  }

  /**
   * Monitorea los eventos de navegación de Angular para enviar PageView en cada cambio de ruta.
   */
  private rastrearCambiosDeRuta(): void {
    this.router.events.pipe(
      filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd)
    ).subscribe((evento: NavigationEnd) => {
      this.rastrearVistaDePagina(evento.urlAfterRedirects);
    });
  }

  // -------------------------------------------------------------------
  // RASTREO BÁSICO Y DE RUTA
  // -------------------------------------------------------------------

  /**
   * Rastra el evento PageView (Visita a la aplicación) en SPAs de Angular.
   * @param url La URL de la página actual.
   */
  private rastrearVistaDePagina(url: string): void {
    if (this.pixelInicializado()) {
      fbq('track', 'PageView');

      // Ejemplo de rastreo avanzado según la URL, genérico para todas las apps
      if (url.includes('/producto/') || url.includes('/articulo/')) {
        this.rastrearContenidoVisto({
          content_name: `Vista de Detalle: ${url}`,
          content_category: 'Lidertech_VistaDetalle',
          content_type: url.includes('/producto/') ? 'product' : 'blog_post'
        });
      }
    }
  }

  // -------------------------------------------------------------------
  // EVENTOS DE CONTENIDO Y ANALÍTICA (VIEWCONTENT, SEARCH, etc.)
  // -------------------------------------------------------------------

  /**
   * Rastra el evento ViewContent para identificar vistas de contenido clave (productos, blogs, servicios).
   * @param data Objeto con el nombre, categoría y IDs del contenido.
   */
  rastrearContenidoVisto(data: MetaPixelContenido): void {
    if (this.pixelInicializado()) {
      fbq('track', 'ViewContent', {
        content_name: data.content_name,
        content_category: data.content_category,
        content_ids: data.content_ids,
        content_type: data.content_type,
        value: data.value,
        currency: data.currency,
      });
    }
  }

  /**
   * Rastra el evento Search cuando el usuario realiza una búsqueda interna.
   * @param data Objeto con la cadena de búsqueda.
   */
  rastrearBusqueda(data: MetaPixelBusqueda): void {
    if (this.pixelInicializado()) {
      fbq('track', 'Search', {
        search_string: data.search_string,
        content_category: data.content_category,
        num_items: data.num_items,
      });
    }
  }

  // -------------------------------------------------------------------
  // EVENTOS DE CONVERSIÓN (LEADS Y VENTAS)
  // -------------------------------------------------------------------

  /**
   * Rastra cuando el usuario inicia un proceso de cotización, compra o registro.
   * Se utiliza InitiateCheckout para medir la intención.
   * @param data Objeto con detalles del contenido.
   */
  rastrearInicioDeProceso(data: MetaPixelContenido): void {
    if (this.pixelInicializado()) {
      fbq('track', 'InitiateCheckout', {
        content_name: data.content_name || 'Inicio de Proceso',
        content_category: data.content_category || 'Lidertech_Intencion',
        value: data.value,
        currency: data.currency,
      });
    }
  }

  /**
   * Rastra la conversión final de un Lead (ej. envío de formulario de contacto, cotización, etc.).
   * Se utiliza el evento 'Lead'.
   * @param data Objeto con detalles de la conversión.
   */
  rastrearLeadGenerado(data: MetaPixelConversion): void {
    if (this.pixelInicializado()) {
      fbq('track', 'Lead', {
        content_name: data.content_name || 'Lead_Generado_Exitoso',
        content_category: data.content_category || 'Lidertech_ConversionLead',
        status: data.status || 'Completado',
        value: data.value,
        currency: data.currency,
      });
    }
  }

  /**
   * Rastra la conversión de un registro de usuario completo.
   * Se utiliza el evento 'CompleteRegistration'.
   * @param data Objeto con detalles del registro.
   */
  rastrearRegistroCompletado(data: MetaPixelConversion): void {
    if (this.pixelInicializado()) {
      fbq('track', 'CompleteRegistration', {
        content_name: data.content_name || 'Registro de Usuario',
        content_category: data.content_category || 'Lidertech_Registro',
        status: data.status || 'Exitoso',
      });
    }
  }

  /**
   * Rastra el evento final de una compra o transacción exitosa.
   * @param data Objeto con el valor y la moneda de la compra.
   */
  rastrearCompraExitosa(data: MetaPixelCompra): void {
    if (this.pixelInicializado()) {
      fbq('track', 'Purchase', {
        content_name: data.content_name || 'Compra_Finalizada',
        content_category: data.content_category || 'Lidertech_Transaccion',
        value: data.value,
        currency: data.currency,
        content_ids: data.content_ids,
        num_items: data.num_items,
      });
    }
  }

  // -------------------------------------------------------------------
  // MÉTODO GENÉRICO PARA EVENTOS PERSONALIZADOS
  // -------------------------------------------------------------------

  /**
   * Permite rastrear cualquier evento personalizado no cubierto por los métodos estándar.
   * @param nombreEvento El nombre del evento de Meta Pixel (ej. 'descarga_manual', 'interaccion_video').
   * @param parametros Un objeto con los datos del evento.
   */
  rastrearEventoPersonalizado(nombreEvento: string, parametros: any): void {
    if (this.pixelInicializado()) {
      fbq('trackCustom', nombreEvento, parametros);
    }
  }
}

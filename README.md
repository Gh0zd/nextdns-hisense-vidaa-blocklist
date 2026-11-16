<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&height=200&section=header&text=Vidaa-Blocklist&fontSize=70&fontAlignY=35&animation=twinkling&fontColor=gradient" alt="Vidaa-Blocklist Header"/>

  <p>
    <img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fapi.github.com%2Frepos%2FGh0zd%2Fnextdns-hisense-vidaa-blocklist&query=%24.archived&style=for-the-badge&label=Archivado&color=brightgreen" alt="Estado de archivo"/>
    <img src="https://img.shields.io/github/last-commit/Gh0zd/nextdns-hisense-vidaa-blocklist?style=for-the-badge&label=%C3%9Altimo%20Commit" alt="Último Commit"/>
    <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5"/>
    <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3"/>
    <img src="https://img.shields.io/badge/JavaScript-ES6-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript ES6"/>
    <img src="https://img.shields.io/badge/Dependencias-0-success?style=for-the-badge" alt="Cero Dependencias"/>
  </p>

  <p>
    <strong>Lista curada e interfaz web interactiva con dominios de telemetría, publicidad y rastreo de Hisense / VIDAA, listos para bloquear en NextDNS.</strong>
  </p>
</div>

---

## Características

* **Clasificación estructurada:** Dominios organizados por categorías específicas para facilitar su revisión y bloqueo selectivo.
* **Buscador y filtrado en tiempo real:** Herramienta integrada para localizar dominios concretos, filtrar por grupo y visualizar el progreso.
* **Soporte bilingüe (i18n):** Interfaz disponible tanto en español como en inglés.
* **Interfaz adaptable:** Diseño responsivo con tema claro/oscuro persistente y libre de cookies de seguimiento.
* **Arquitectura sin dependencias:** Aplicación construida íntegramente con tecnologías web nativas (`HTML`, `CSS` y `JavaScript`).

## Inicio rápido

1. Clona o descarga este repositorio en tu equipo local.
2. Abre el archivo `index.html` directamente en tu navegador web.
3. Utiliza el buscador o los filtros por categoría para copiar los dominios deseados.
4. Pega la selección dentro de la lista de denegación (*Denylist*) de tu perfil en [NextDNS](https://nextdns.io).

> [!TIP]
> Si deseas aportar nuevos dominios de telemetría detectados en televisores Hisense o el sistema VIDAA, puedes enviar un Pull Request editando el archivo fuente `data/domains.json`.

## Estructura del proyecto

```text
.
├── index.html          # Página principal e interfaz de usuario
├── css/
│   └── styles.css      # Hojas de estilo y soporte de temas (claro/oscuro)
├── js/
│   ├── app.js          # Lógica de filtrado, copiado e internacionalización (i18n)
│   └── domains.js      # Datos de dominios embebidos para ejecución local sin servidor
├── data/
│   └── domains.json    # Fuente principal estructurada de la lista de bloqueo
└── docs/
    └── screenshot.png  # Captura de pantalla de la interfaz
```

## Capturas

<p align="center">
  <img src="docs/screenshot.png" alt="Interfaz de Vidaa-Blocklist" width="80%" />
</p>

# Dólar Hoy Argentina

App que muestra la cotización del dólar en pesos argentinos (blue, oficial, MEP, CCL, cripto y tarjeta), tomando los datos de [dolarhoy.com](https://dolarhoy.com/).

- `api/cotizaciones.js`: función serverless que lee dolarhoy.com y devuelve JSON. El CDN de Vercel la cachea 2 horas (`s-maxage=7200`), así que los datos se renuevan cada 2 horas.
- `public/index.html`: interfaz con tarjetas de cotizaciones y conversor USD ↔ pesos. También se recarga sola cada 2 horas si la pestaña queda abierta.

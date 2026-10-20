# Dólar Hoy Argentina

App que muestra la cotización del dólar en pesos argentinos (blue, oficial, MEP, CCL, cripto y tarjeta), tomando los datos de [dolarhoy.com](https://dolarhoy.com/).

- `api/cotizaciones.js`: función serverless que lee dolarhoy.com y devuelve JSON. El CDN de Vercel la cachea 10 minutos (`s-maxage=600`), así que los datos se renuevan cada 10 minutos.
- `public/index.html`: interfaz con tarjetas de cotizaciones y conversor USD ↔ pesos. También se recarga sola cada 10 minutos si la pestaña queda abierta.

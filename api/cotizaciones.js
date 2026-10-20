// Toma las cotizaciones de https://dolarhoy.com/ y las devuelve en JSON.
// La respuesta queda cacheada en el CDN de Vercel por 10 minutos (s-maxage=600),
// así que dolarhoy.com se consulta como máximo una vez cada 10 minutos.

const SOURCE = 'https://dolarhoy.com/';
const CACHE_SECONDS = 10 * 60;

const decode = (s) =>
  s
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim();

// "$1.536,70" -> 1536.7
const toNumber = (s) => {
  if (!s) return null;
  const n = Number(s.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

export function parse(html) {
  const cotizaciones = [];
  // Cada cotización principal empieza con <a class="titleText" ...>Nombre</a>
  const titleRe = /<a class="titleText"[^>]*>([\s\S]*?)<\/a>/g;
  const matches = [...html.matchAll(titleRe)];

  matches.forEach((m, i) => {
    const start = m.index + m[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : start + 4000;
    const block = html.slice(start, end);
    const compra = block.match(/class="compra">(?:(?!class="venta").)*?class="val"[^>]*>([^<]*)</s);
    const venta = block.match(/class="venta">[\s\S]*?class="val"[^>]*>([^<]*)</);
    const nombre = decode(m[1]);
    if (!nombre || (!compra && !venta)) return;
    if (cotizaciones.some((c) => c.nombre === nombre)) return;
    cotizaciones.push({
      nombre,
      compra: toNumber(compra?.[1]),
      venta: toNumber(venta?.[1]),
    });
  });

  const act = html.match(/Actualizado por última vez:\s*([^<]+)/);
  return {
    cotizaciones,
    actualizadoFuente: act ? decode(act[1]) : null,
  };
}

export default async function handler(req, res) {
  try {
    const r = await fetch(SOURCE, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36',
        'Accept-Language': 'es-AR,es;q=0.9',
      },
    });
    if (!r.ok) throw new Error(`dolarhoy.com respondió ${r.status}`);
    const data = parse(await r.text());
    if (!data.cotizaciones.length) throw new Error('No se encontraron cotizaciones en la página');

    res.setHeader('Cache-Control', `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=60`);
    res.status(200).json({
      fuente: SOURCE,
      obtenido: new Date().toISOString(),
      proximaActualizacion: new Date(Date.now() + CACHE_SECONDS * 1000).toISOString(),
      ...data,
    });
  } catch (err) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({ error: err.message });
  }
}

/* Cloudflare Pages (modo avanzado): guarda los ajustes del Estudio para que se vean igual en todos los dispositivos.
   Configurar una sola vez en Cloudflare (Workers & Pages > tu proyecto > Settings):
     - Bindings > Add > KV namespace: nombre de variable AJUSTES (crea un KV, por ejemplo "starlight-ajustes").
     - Variables and Secrets > Add: CLAVE_ESTUDIO = la clave que tú elijas (tipo Secret).
   Después vuelve a subir el sitio. Todo lo demás se sirve tal cual. */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/ajustes') {
      const h = { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store' };
      if (!env.AJUSTES) return new Response('{}', { status:200, headers:h });
      if (request.method === 'GET') return new Response((await env.AJUSTES.get('estudio')) || '{}', { headers:h });
      if (request.method === 'PUT') {
        if (!env.CLAVE_ESTUDIO || request.headers.get('x-clave') !== env.CLAVE_ESTUDIO) return new Response('{"error":"clave"}', { status:401, headers:h });
        const t = await request.text();
        if (t.length > 60000) return new Response('{"error":"grande"}', { status:413, headers:h });
        try { const o = JSON.parse(t); if (!o || typeof o !== 'object' || Array.isArray(o)) throw 0; } catch (e) { return new Response('{"error":"json"}', { status:400, headers:h }); }
        await env.AJUSTES.put('estudio', t);
        return new Response('{"ok":true}', { headers:h });
      }
      return new Response('{"error":"metodo"}', { status:405, headers:h });
    }
    return env.ASSETS.fetch(request);
  }
};

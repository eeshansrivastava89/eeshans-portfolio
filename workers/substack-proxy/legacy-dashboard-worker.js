export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === '/substack/posts') {
      const res = await fetch("https://theasymptotic.substack.com/api/v1/posts?limit=25", {
        headers: {
          "Accept": "application/json, text/plain;q=0.9, */*;q=0.8",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36"
        }
      });

      if (!res.ok) {
        return new Response(`Upstream Substack error: ${res.status}`, { status: 502 });
      }

      const data = await res.json();
      return Response.json(data, {
        headers: { "Cache-Control": "no-store" }
      });
    }

    return new Response("Not found", { status: 404 });
  }
};
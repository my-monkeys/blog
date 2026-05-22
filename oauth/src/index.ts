interface Env {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
}

const SCOPE = 'repo,user';

function renderCallback(message: string, content: string): string {
  return `<!doctype html>
<html><body><script>
(function(){
  function send(){
    if (!window.opener) { document.body.textContent='No opener'; return; }
    window.opener.postMessage('authorizing:github', '*');
    setTimeout(function(){
      window.opener.postMessage('authorization:github:${message}:${content}', '*');
      window.close();
    }, 250);
  }
  send();
})();
</script></body></html>`;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === '/auth') {
      const redirectUri = `${url.origin}/callback`;
      const ghUrl = new URL('https://github.com/login/oauth/authorize');
      ghUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
      ghUrl.searchParams.set('redirect_uri', redirectUri);
      ghUrl.searchParams.set('scope', SCOPE);
      return Response.redirect(ghUrl.toString(), 302);
    }

    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      if (!code) {
        return new Response(renderCallback('error', JSON.stringify({ message: 'missing-code' })), {
          headers: { 'Content-Type': 'text/html' },
        });
      }
      try {
        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            client_id: env.GITHUB_CLIENT_ID,
            client_secret: env.GITHUB_CLIENT_SECRET,
            code,
          }),
        });
        const data = (await tokenRes.json()) as { access_token?: string; error?: string };
        if (!data.access_token) {
          return new Response(
            renderCallback('error', JSON.stringify({ message: data.error ?? 'no-token' })),
            { headers: { 'Content-Type': 'text/html' } },
          );
        }
        const payload = { token: data.access_token, provider: 'github' };
        return new Response(renderCallback('success', JSON.stringify(payload)), {
          headers: { 'Content-Type': 'text/html' },
        });
      } catch (e) {
        return new Response(
          renderCallback('error', JSON.stringify({ message: String(e) })),
          { headers: { 'Content-Type': 'text/html' } },
        );
      }
    }

    return new Response('decap-oauth worker — see /auth', { status: 200 });
  },
};

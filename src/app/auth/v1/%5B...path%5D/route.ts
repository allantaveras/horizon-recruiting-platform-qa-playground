import { NextResponse } from 'next/server';

async function handleProxy(request: Request, { params }: { params: { path: string[] } }) {
  const pathStr = params.path.join('/');
  // Resolve host inside the Docker network
  const targetUrl = `http://auth:9999/${pathStr}${new URL(request.url).search}`;

  const body = ['GET', 'HEAD'].includes(request.method) ? undefined : await request.text();
  const headers = new Headers(request.headers);
  headers.set('host', 'auth:9999');

  try {
    const res = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
    });

    const responseHeaders = new Headers(res.headers);
    responseHeaders.delete('content-encoding');

    const responseText = await res.text();
    return new NextResponse(responseText, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error('Server-side Auth proxy failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export { handleProxy as GET, handleProxy as POST, handleProxy as PUT, handleProxy as DELETE, handleProxy as PATCH };

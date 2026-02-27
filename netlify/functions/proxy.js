exports.handler = async (event) => {
  // Remove "/proxy/"
  const rawPath = event.path.replace(/^\/proxy\//, "");
  const decodedPath = decodeURIComponent(rawPath);

  // Get query string
  const queryString = event.rawQuery ? "?" + event.rawQuery : "";

  const targetUrl = "http://" + decodedPath + queryString;

  try {
    const response = await fetch(targetUrl);
    const buffer = await response.arrayBuffer();

    return {
      statusCode: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") || "application/octet-stream",
        "Access-Control-Allow-Origin": "*"
      },
      body: Buffer.from(buffer).toString("base64"),
      isBase64Encoded: true
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: "Proxy error"
    };
  }
};

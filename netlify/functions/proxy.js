exports.handler = async (event) => {
  const url = event.queryStringParameters.url;

  if (!url) {
    return { statusCode: 400, body: "Missing URL" };
  }

  try {
    const response = await fetch(url);
    const body = await response.arrayBuffer();

    return {
      statusCode: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") || "application/octet-stream",
        "Access-Control-Allow-Origin": "*"
      },
      body: Buffer.from(body).toString("base64"),
      isBase64Encoded: true
    };
  } catch (err) {
    return { statusCode: 500, body: "Proxy error" };
  }
};

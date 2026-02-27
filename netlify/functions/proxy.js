exports.handler = async (event) => {
  try {
    // Remove "/proxy/" from beginning
    let fullUrl = event.path.replace(/^\/proxy\//, "");

    // Add query string back if exists
    if (event.rawQuery) {
      fullUrl += "?" + event.rawQuery;
    }

    // Decode in case browser encoded parts
    fullUrl = decodeURIComponent(fullUrl);

    // If protocol missing, assume http
    if (!fullUrl.startsWith("http://") && !fullUrl.startsWith("https://")) {
      fullUrl = "http://" + fullUrl;
    }

    const response = await fetch(fullUrl);

    const buffer = await response.arrayBuffer();

    return {
      statusCode: response.status,
      headers: {
        "Content-Type":
          response.headers.get("content-type") || "application/octet-stream",
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

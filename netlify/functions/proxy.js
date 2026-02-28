exports.handler = async (event) => {
  try {
    const target = event.queryStringParameters?.url;
    if (!target) {
      return { statusCode: 400, body: "Missing url" };
    }

    const fullUrl = decodeURIComponent(target);

    const response = await fetch(fullUrl);

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("mpd")) {
      const text = await response.text();
      return {
        statusCode: response.status,
        headers: {
          "Content-Type": contentType,
          "Access-Control-Allow-Origin": "*"
        },
        body: text
      };
    }

    const buffer = await response.arrayBuffer();

    return {
      statusCode: response.status,
      headers: {
        "Content-Type": contentType || "application/octet-stream",
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

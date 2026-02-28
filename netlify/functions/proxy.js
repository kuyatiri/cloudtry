exports.handler = async (event) => {
  try {
    let fullUrl = event.path.replace(/^\/proxy\//, "");

    if (event.rawQuery) {
      fullUrl += "?" + event.rawQuery;
    }

    fullUrl = decodeURIComponent(fullUrl);

    if (!fullUrl.startsWith("http")) {
      fullUrl = "http://" + fullUrl;
    }

    console.log("Fetching:", fullUrl);

    const response = await fetch(fullUrl, {
      headers: {
        "User-Agent": event.headers["user-agent"] || "",
        "Referer": fullUrl,
        "Accept": "*/*",
        "Connection": "keep-alive"
      }
    });

    const contentType =
      response.headers.get("content-type") || "application/octet-stream";

    const buffer = await response.arrayBuffer();

    return {
      statusCode: response.status,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*"
      },
      body: Buffer.from(buffer).toString("base64"),
      isBase64Encoded: true
    };

  } catch (err) {
    console.error("Proxy error:", err);

    return {
  statusCode: response.status,
  headers: {
    "Content-Type": contentType,
    "Access-Control-Allow-Origin": "*"
  },
  body: await response.text()
};
  }
};

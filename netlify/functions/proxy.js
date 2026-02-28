exports.handler = async (event) => {
  try {
    // Remove /proxy/ prefix
    let fullUrl = event.path.replace(/^\/proxy\//, "");

    // Re-attach original query string
    if (event.rawQuery) {
      fullUrl += "?" + event.rawQuery;
    }

    // Decode only encoded parts (like %3A)
    fullUrl = decodeURIComponent(fullUrl);

    // Add protocol if missing
    if (!fullUrl.startsWith("http")) {
      fullUrl = "http://" + fullUrl;
    }

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
    return {
  statusCode: response.status,
  headers: {
    "Content-Type": contentType,
    "Access-Control-Allow-Origin": "*"
  },
  body: await response.text()
};
};

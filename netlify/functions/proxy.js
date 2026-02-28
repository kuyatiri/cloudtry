exports.handler = async (event) => {
  try {

    // Remove "/proxy/" from path
    let fullUrl = event.path.replace(/^\/proxy\//, "");

    // Append original query string
    if (event.rawQuery) {
      fullUrl += "?" + event.rawQuery;
    }

    // Decode URL (so %3A becomes :)
    fullUrl = decodeURIComponent(fullUrl);

    // Re-add http if missing
    if (!fullUrl.startsWith("http")) {
      fullUrl = "http://" + fullUrl;
    }

    console.log("Fetching:", fullUrl);

    const response = await fetch(fullUrl, {
      headers: {
        "User-Agent": event.headers["user-agent"] || "Mozilla/5.0",
        "Accept": "*/*",
        "Referer": fullUrl
      }
    });

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
    console.error("Proxy error:", err);
    return {
      statusCode: 500,
      body: "Proxy error"
    };
  }
};

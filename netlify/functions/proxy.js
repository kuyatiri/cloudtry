exports.handler = async (event) => {
  try {

    // Remove /proxy/ from path
    const prefix = "/proxy/";
    let encodedUrl = event.path.startsWith(prefix)
      ? event.path.slice(prefix.length)
      : "";

    if (!encodedUrl) {
      return { statusCode: 400, body: "Missing target URL" };
    }

    const fullUrl = decodeURIComponent(encodedUrl);

    console.log("Fetching:", fullUrl);

    const response = await fetch(fullUrl);

    const contentType = response.headers.get("content-type") || "";

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
    console.error("Proxy error:", err);
    return {
      statusCode: 500,
      body: "ERROR: " + err.message
    };
  }
};

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

    const response = await fetch(fullUrl);

    return {
      statusCode: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") || "application/octet-stream",
        "Access-Control-Allow-Origin": "*"
      },
      body: await response.text(), // ⚠ MPD only
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: "Proxy error"
    };
  }
};

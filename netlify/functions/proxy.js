function resolveStreamUrl(channel) {
    try {

        const url = new URL(channel.url);

        if (url.protocol === "http:") {

            const hostPort = url.port
                ? url.hostname + "%3A" + url.port
                : url.hostname;

            return window.location.origin +
                "/proxy/" +
                hostPort +
                url.pathname +
                url.search;
        }

        return channel.url;

    } catch (err) {
        console.error(err);
        return channel.url;
    }
}

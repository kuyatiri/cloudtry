<?php
// Function to fetch and return the content of a given URL, handling redirects
function fetch_content($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true); // Enable following redirects
    curl_setopt($ch, CURLOPT_MAXREDIRS, 10); // Maximum number of redirects to follow
curl_setopt($ch, CURLOPT_FRESH_CONNECT, true); // Ensure a fresh connection
curl_setopt($ch, CURLOPT_FORBID_REUSE, true);  // Do not reuse the connection
    $content = curl_exec($ch);
    $final_url = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
    curl_close($ch);
    return [$content, $final_url];
}

// Function to modify segment URLs in the M3U8 content
function modify_m3u8_content($base_url, $m3u8_content) {
    return preg_replace_callback('/(\/?[^\/\s]+?\.(?:ts|m3u8|mp4|aac|m4s|webvtt|vtt)[a-zA-Z0-9-_\.]*)/',
        function ($matches) use ($base_url) {
            // Return the full URL for each segment
            return $base_url . ltrim($matches[1], '/');
        },
        $m3u8_content
    );
}

// Get the URL parameter from the query string
$playlist_url = isset($_GET['url']) ? $_GET['url'] : '';

if (empty($playlist_url)) {
    header("HTTP/1.1 400 Bad Request");
    echo "URL parameter is missing.";
    exit;
}

// Fetch the original M3U8 content and get the final URL after redirects
list($original_m3u8_content, $final_url) = fetch_content($playlist_url);

if ($original_m3u8_content === false) {
    header("HTTP/1.1 500 Internal Server Error");
    echo "Error fetching the original M3U8 file.";
    exit;
}

// Parse the URL
    $parsedUrl = parse_url($final_url);

// Rebuild the base URL from its components
    $base_url = $parsedUrl['scheme'] . '://' . $parsedUrl['host'];

    // Check if the URL has a path and it's not just '/'
    if (isset($parsedUrl['path']) && $parsedUrl['path'] !== '/') {
        $base_url .= dirname($parsedUrl['path']);
        // Ensure the directory path ends with a slash
        if (substr($base_url, -1) !== '/') {
            $base_url .= '/';
        }
    }

// Modify the M3U8 content to rewrite segment URLs
$modified_m3u8_content = modify_m3u8_content($base_url, $original_m3u8_content);

// Serve the modified M3U8 file
header('Content-Type: application/vnd.apple.mpegurl');
echo $modified_m3u8_content;
?>
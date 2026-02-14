<?php
// Function to fetch and return the content of a given URL
function fetch_content($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    $content = curl_exec($ch);
    curl_close($ch);
    return $content;
}

// Function to modify segment URLs in the M3U8 content
function modify_m3u8_content($base_url, $m3u8_content) {
    return preg_replace_callback(
        '/(playlist720_p_\d+\.ts|tv5_qp_\d+\.m3u8|index_4_\d+\.ts|segment_\d+\.\w+)/',
        function ($matches) use ($base_url) {
            return $base_url . $matches[1];
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

// Fetch the original M3U8 content
$original_m3u8_content = fetch_content($playlist_url);

if ($original_m3u8_content === false) {
    header("HTTP/1.1 500 Internal Server Error");
    echo "Error fetching the original M3U8 file.";
    exit;
}

// Extract the base URL
$parsed_url = parse_url($playlist_url);
$base_url = $parsed_url['scheme'] . '://' . $parsed_url['host'] . dirname($parsed_url['path']) . '/';

// Modify the M3U8 content to rewrite segment URLs
$modified_m3u8_content = modify_m3u8_content($base_url, $original_m3u8_content);

// Serve the modified M3U8 file
header('Content-Type: application/vnd.apple.mpegurl');
echo $modified_m3u8_content;
?>
<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

// URL of the online M3U playlist
$playlistUrl = 'https://raw.githubusercontent.com/kuyatiri/iptv/main/channels';

// Function to check if a URL is active
function is_url_active($url) {
    $headers = @get_headers($url);
    return $headers && strpos($headers[0], '200') !== false;
}

// Fetch the playlist content
$playlistContent = file_get_contents($playlistUrl);
if ($playlistContent === false) {
    header('HTTP/1.1 500 Internal Server Error');
    echo 'Error fetching the playlist.';
    exit;
}

// Parse the playlist content
$lines = explode("\n", $playlistContent);
$activePlaylists = [];

header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('Access-Control-Allow-Origin: *');

for ($i = 0; $i < count($lines); $i++) {
    if (strpos($lines[$i], '#EXTINF:') === 0) {
        $infoLine = $lines[$i];
        $urlLine = trim($lines[$i + 1]);
        if (is_url_active($urlLine)) {
            preg_match('/tvg-logo="([^"]*)".*group-title="([^"]*)",([^$]+)/', $infoLine, $matches);
            
            $logo = '';
            if (!empty($matches[1]) && (strpos($matches[1], 'http://') === 0 || strpos($matches[1], 'https://') === 0)) {
                $logo = $matches[1];
            } elseif (!empty($matches[1])) {
                // Extract the URL from the string that contains 'tvg-logo='
                preg_match('/tvg-logo=(http[^"]+)/', $matches[1], $logoMatches);
                if (!empty($logoMatches[1])) {
                    $logo = $logoMatches[1];
                }
            }

            $groupTitle = $matches[2] ?? '';
            $name = $matches[3] ?? 'Unknown';

            $data = [
                'name' => $name,
                'logo' => $logo,
                'groupTitle' => $groupTitle,
                'url' => $urlLine
            ];

            echo "data: " . json_encode($data) . "\n\n";
            ob_flush();
            flush();
        }
    }
}

echo "event: end\n";
echo "data: End of playlist\n\n";
ob_flush();
flush();
?>

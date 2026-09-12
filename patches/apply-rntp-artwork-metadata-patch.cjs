const fs = require("fs");
const path = require("path");

const modulePath = path.join(
    __dirname,
    "..",
    "node_modules",
    "react-native-track-player",
    "android",
    "src",
    "main",
    "java",
    "com",
    "doublesymmetry",
    "trackplayer",
    "module",
    "MusicModule.kt",
);

if (!fs.existsSync(modulePath)) {
    console.warn("RN Track Player is not installed; artwork metadata patch was skipped.");
    process.exit(0);
}

const source = fs.readFileSync(modulePath, "utf8");
const methodStart = source.indexOf("fun updateNowPlayingMetadata(map: ReadableMap?, callback: Promise)");
const existingPatch = "track.artwork = musicService.currentTrack.artwork";
if (methodStart < 0) {
    throw new Error("Unsupported react-native-track-player MusicModule.kt; artwork patch was not applied.");
}
if (source.indexOf(existingPatch, methodStart) >= 0) {
    process.exit(0);
}
const trackDeclaration = "            val track = bundleToTrack(it)";
const trackPosition = source.indexOf(trackDeclaration, methodStart);
if (trackPosition < 0) {
    throw new Error("Unsupported react-native-track-player MusicModule.kt; artwork patch was not applied.");
}

const insertionPoint = trackPosition + trackDeclaration.length;
const newline = source.includes("\r\n") ? "\r\n" : "\n";
const fallback = [
    "            // Metadata-only updates must retain the active item's cover.",
    "            if (track.artwork == null) {",
    "                track.artwork = musicService.currentTrack.artwork",
    "            }",
].join(newline);
fs.writeFileSync(
    modulePath,
    source.slice(0, insertionPoint) + newline + fallback + source.slice(insertionPoint),
);

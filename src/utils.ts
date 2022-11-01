export function jsonToManifest(manifestJson: Map<string, string>): string {
    return Array.from(manifestJson.entries()).map(([key, value]): string => {
        return `${key}=${value}`;
    }).join('\n');
}

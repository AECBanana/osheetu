import { Metadata } from 'next';

interface BeatmapViewerPageProps {
    params: {
        beatmapId: string;
    };
}

export async function generateMetadata({ params }: BeatmapViewerPageProps): Promise<Metadata> {
    const beatmapId = params.beatmapId;

    return {
        title: `Beatmap Viewer - ${beatmapId}`,
        description: `View osu! beatmap ${beatmapId} in the web player`,
    };
}

export default function BeatmapViewerPage({ params }: BeatmapViewerPageProps) {
    const beatmapId = params.beatmapId;

    // 使用iframe嵌入beatmap-viewer-web
    return (
        <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
            <iframe
                src={`/beatmap-viewer/index.html?b=${beatmapId}`}
                style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    margin: 0,
                    padding: 0
                }}
                title={`Beatmap Viewer - ${beatmapId}`}
                allow="cross-origin-isolated"
            />
        </div>
    );
}
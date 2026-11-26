// In-app player: uploaded videos (expo-video, signed R2 stream) and YouTube / Vimeo embeds.
import React, { useState } from "react";
import { ActivityIndicator, Linking, ScrollView, View, useWindowDimensions } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useVideoPlayer, VideoView } from "expo-video";
import { WebView } from "react-native-webview";
import { useApp } from "../../lib/store";
import { useVideos, type Video } from "../../lib/videos";
import { space } from "../../lib/theme";
import { Button, EmptyState, IconButton, Row, Txt } from "../../components/ui";
import { VideoCard } from "../../components/VideoCard";

function FilePlayer({ src }: { src: string }) {
  const player = useVideoPlayer(src, p => { p.play(); });
  return <VideoView player={player} style={{ flex: 1 }} fullscreenOptions={{ enable: true }} allowsPictureInPicture contentFit="contain" nativeControls />;
}

function EmbedPlayer({ v }: { v: Video }) {
  const { palette } = useApp();
  const [loading, setLoading] = useState(true);
  const src = v.type === "youtube"
    ? `https://www.youtube-nocookie.com/embed/${v.ref}?playsinline=1&rel=0&modestbranding=1&autoplay=1`
    : `https://player.vimeo.com/video/${v.ref}?autoplay=1&title=0&byline=0&portrait=0`;
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;height:100%;background:#000}iframe{position:absolute;inset:0;width:100%;height:100%;border:0}</style></head>
<body><iframe src="${src}" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></body></html>`;
  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <WebView
        source={{ html, baseUrl: "https://rwh-planner.vercel.app" }}
        originWhitelist={["https://*"]}
        allowsFullscreenVideo mediaPlaybackRequiresUserAction={false} allowsInlineMediaPlayback javaScriptEnabled
        onLoadEnd={() => setLoading(false)}
        setSupportMultipleWindows={false}
        onShouldStartLoadWithRequest={req => req.url.startsWith("https://") || req.url.startsWith("about:")}
        style={{ flex: 1, backgroundColor: "#000" }}
      />
      {loading ? <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={palette.aqua} size="large" /></View> : null}
    </View>
  );
}

export default function VideoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { palette, lang, t, rtl } = useApp();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { data } = useVideos();
  const v = data?.videos.find(x => x.id === id);
  const landscape = width > height;
  const related = v ? (data?.videos || []).filter(x => x.category === v.category && x.id !== v.id).slice(0, 3) : [];
  if (!v) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top }}>
        <IconButton name="back" label={t("back")} flip={rtl} onPress={() => router.back()} />
        <EmptyState icon="learn" title={t("playerError")} />
      </View>
    );
  }
  const playerH = landscape ? height - insets.top - insets.bottom : Math.round((width * 9) / 16);
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ paddingTop: insets.top, backgroundColor: "#000" }}>
        {!landscape ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 4, height: 52 }}>
            <IconButton name="back" label={t("back")} color="#fff" flip={rtl} onPress={() => router.back()} />
            <Txt v="small" color="#fff" numberOfLines={1} style={{ flex: 1 }}>{v.title[lang] || v.title.en}</Txt>
          </View>
        ) : null}
        <View style={{ height: playerH, width: "100%" }}>
          {v.type === "file" && v.src ? <FilePlayer src={v.src} /> : v.ref ? <EmbedPlayer v={v} /> : <EmptyState icon="learn" title={t("playerError")} />}
        </View>
        {landscape ? <View style={{ position: "absolute", top: insets.top + 4, left: 4 }}><IconButton name="back" label={t("back")} color="#fff" bg="rgba(0,0,0,0.45)" flip={rtl} onPress={() => router.back()} /></View> : null}
      </View>
      {!landscape ? (
        <ScrollView contentContainerStyle={{ padding: space.l, gap: space.m, paddingBottom: insets.bottom + space.xl }}>
          <Txt v="h2">{v.title[lang] || v.title.en}</Txt>
          {v.desc ? <Txt color={palette.ink2}>{v.desc[lang] || v.desc.en}</Txt> : null}
          {v.source ? <Txt v="small" color={palette.muted}>{t("sourceBy", { s: v.source })}</Txt> : null}
          <Row wrap gap={8}>
            {v.sourceUrl ? <Button title={t("watchOn", { s: v.sourceUrl.replace(/^https?:\/\/(www\.)?/, "").split("/")[0] })} kind="tonal" small icon="external" onPress={() => Linking.openURL(v.sourceUrl!)} /> : null}
          </Row>
          {related.length ? <Txt v="h3" style={{ marginTop: space.m }}>{t("relatedVideos")}</Txt> : null}
          {related.map(r => <VideoCard key={r.id} v={r} />)}
        </ScrollView>
      ) : null}
    </View>
  );
}

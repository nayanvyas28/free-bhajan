
                <Animated.View 
                  pointerEvents={showControls ? 'auto' : 'none'}
                  style={[styles.videoOverlay, { opacity: showControls ? 1 : 0, zIndex: 2 }]}
                >
                  <View style={styles.overlayMain}>
                    <TouchableOpacity onPress={() => seek(-10)}><SkipBack size={32} color="#FFF" /></TouchableOpacity>
                    <TouchableOpacity onPress={isPlaying ? pauseVideo : resumeVideo} style={styles.overlayPlay}>
                      {isPlaying ? <Pause size={44} color="#FFF" fill="#FFF" /> : <Play size={44} color="#FFF" fill="#FFF" style={{ marginLeft: 5 }} />}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => seek(10)}><SkipForward size={32} color="#FFF" /></TouchableOpacity>
                  </View>
                  
                  <View style={styles.overlayBottom}>
                    <Text style={styles.overlayTime}>{formatTime(position)} {isUnknownDuration ? '' : `/ ${displayDuration}`}</Text>
                    <View 
                      {...panResponder.current.panHandlers}
                      onLayout={(e) => updateBarWidth(e.nativeEvent.layout.width)}
                      style={styles.progressBarTouchable}
                    >
                      <View style={[styles.overlayProgBg, { position: 'relative' }]}>
                        <View style={[styles.overlayProgFill, { width: isUnknownDuration ? '0%' : `${progressPct}%`, backgroundColor: theme.primary }]} />
                        <View style={[styles.overlayProgHandle, { left: isUnknownDuration ? '0%' : `${progressPct}%`, backgroundColor: theme.primary }]} />
                      </View>
                    </View>
                  </View>
                </Animated.View>



                {isBuffering && <View style={styles.loaderOverlay}><ActivityIndicator size="large" color={theme.primary} /></View>}
              </View>

              <View style={styles.videoInfoArea}>
                <Text style={[styles.videoTtl, { color: theme.text }]} numberOfLines={2}>{title}</Text>
                <Text style={[styles.videoSub, { color: theme.primary }]}>{category}</Text>
              </View>

              <View style={styles.upNextContainer}>
                <View style={styles.upNextHeader}>
                  <List size={20} color={theme.text} />
                  <Text style={[styles.upNextTtl, { color: theme.text }]}>Up Next</Text>
                </View>
                {upNext.map((item, idx) => (
                  <TouchableOpacity key={idx} style={styles.upNextItem} onPress={() => playVideo(item, queue)}>
                    <Image source={{ uri: item.thumbnail || item.image_url || item.snippet?.thumbnails?.high?.url }} style={styles.upNextThumb} />
                    <View style={styles.upNextInfo}>
                      <Text style={[styles.upNextItemTtl, { color: theme.text }]} numberOfLines={2}>{item.title || item.snippet?.title}</Text>
                      <Text style={[styles.upNextItemSub, { color: theme.subtext }]}>{item.category || item.snippet?.channelTitle}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Lyrics for Video Mode */}
              {(currentVideo?.description || currentVideo?.snippet?.description) && (
                <View style={styles.videoLyricsContainer}>
                  <View style={styles.upNextHeader}>
                    <BookOpen size={20} color={theme.text} />
                    <Text style={[styles.upNextTtl, { color: theme.text }]}>Lyrics / Description</Text>
                  </View>
                  <View style={[styles.lyricsArea, { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 24, padding: 20 }]}>
                    <Text style={[styles.lyricsText, { color: theme.text, textAlign: 'left', fontSize: 14 }]}>
                      {currentVideo?.description || currentVideo?.snippet?.description}
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>
          )}
        </Animated.View>

        {/* MINI PLAYER */}
        <Animated.View style={[styles.miniBar, { opacity: expandAnim.interpolate({ inputRange: [0, 0.3], outputRange: [1, 0] }) }]} pointerEvents={isExpanded ? 'none' : 'auto'}>
          <TouchableOpacity activeOpacity={1} onPress={toggleExpand} style={styles.miniContent}>
            {thumbnail ? <Image source={{ uri: thumbnail }} style={styles.miniArt} /> : <View style={[styles.miniArt, { backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center' }]}><Text>🎵</Text></View>}
            <View style={{ flex: 1, marginLeft: 14 }}><Text style={[styles.miniTtl, { color: theme.text }]} numberOfLines={1}>{title}</Text><Text style={styles.miniSts}>{isBuffering ? t('connecting') : isPlaying ? t('playing') : t('paused')}</Text></View>
            <TouchableOpacity onPress={() => isPlaying ? pauseVideo() : resumeVideo()}>{isPlaying ? <Pause size={26} color={theme.primary} /> : <Play size={26} color={theme.primary} />}</TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', left: 0, right: 0, overflow: 'hidden', zIndex: 10000, elevation: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, height: 120 },
  headerBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  headerTtl: { fontSize: 13, fontFamily: 'Outfit-Black', textTransform: 'uppercase', letterSpacing: 2, opacity: 0.8 },
  
  audioContainer: { flex: 1, paddingHorizontal: 32, alignItems: 'center', justifyContent: 'center' },
  artworkContainer: { 
    width: width - 80, 
    aspectRatio: 1, 
    borderRadius: 32, 
    overflow: 'hidden', 
    elevation: 20, 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 20,
    backgroundColor: '#121212',
    marginTop: -20,
  },
  artwork: { width: '100%', height: '100%' },
  audioInfoArea: { width: '100%', flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 12 },
  spotifyTtl: { fontSize: 22, fontFamily: 'Outfit-Bold', marginBottom: 2, letterSpacing: -0.5 },
  spotifySub: { fontSize: 14, fontFamily: 'Outfit-Medium' },
  spotifyProgArea: { width: '100%', marginBottom: 20 },
  progBg: { height: 3, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 1.5, position: 'relative' },
  progFill: { height: '100%', borderRadius: 1.5 },
  progHandle: { width: 10, height: 10, borderRadius: 5, position: 'absolute', top: -3.5 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  timeT: { fontSize: 11, fontFamily: 'Outfit-Bold', color: '#B3B3B3', opacity: 0.6 },
  spotifyCtrlRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 40 },
  sideBtn: {
    padding: 10,
    opacity: 0.9
  },
  spotifyPlayBtn: { 
    width: 68, 
    height: 68, 
    borderRadius: 34, 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 15,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },

  videoScroll: { flex: 1 },
  videoWrapper: { 
    width: width, 
    aspectRatio: 16 / 9, 
    backgroundColor: '#000',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  fullVideo: { width: '100%', height: '100%' },
  videoInfoArea: { paddingHorizontal: 24, marginTop: 24 },
  videoTtl: { fontSize: 22, fontFamily: 'Outfit-Bold', lineHeight: 30 },
  videoSub: { fontSize: 14, fontFamily: 'Outfit-Black', marginTop: 6, textTransform: 'uppercase', letterSpacing: 1.5, opacity: 0.7 },
  
  upNextContainer: { paddingHorizontal: 24, marginTop: 32, paddingBottom: 100 },
  upNextHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  upNextTtl: { fontSize: 18, fontFamily: 'Outfit-Bold' },
  upNextItem: { 
    flexDirection: 'row', 
    gap: 16, 
    marginBottom: 20, 
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  upNextThumb: { width: 100, height: 60, borderRadius: 12 },
  upNextInfo: { flex: 1 },
  upNextItemTtl: { fontSize: 15, fontFamily: 'Outfit-Bold' },
  upNextItemSub: { fontSize: 12, fontFamily: 'Outfit-Medium', marginTop: 4, opacity: 0.5 },

  videoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  overlayMain: { flexDirection: 'row', alignItems: 'center', gap: 40 },
  overlayPlay: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  overlayBottom: { position: 'absolute', bottom: 24, left: 24, right: 24 },
  overlayTime: { color: '#FFF', fontSize: 14, fontFamily: 'Outfit-Black', marginBottom: 14, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4 },
  progressBarTouchable: { width: '100%', height: 30, justifyContent: 'center' },
  overlayProgBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3 },
  overlayProgFill: { height: '100%', borderRadius: 3 },
  overlayProgHandle: { width: 16, height: 16, borderRadius: 8, position: 'absolute', top: -5, marginLeft: -8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 3 },

  loaderOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  miniBar: { 
    ...StyleSheet.absoluteFillObject, 
    height: 75, 
    backgroundColor: 'rgba(18, 18, 18, 0.95)',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  miniContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  miniArt: { width: 50, height: 50, borderRadius: 12 },
  miniTtl: { fontSize: 15, fontFamily: 'Outfit-Bold' },
  miniSts: { fontSize: 12, fontFamily: 'Outfit-Medium', color: '#9CA3AF', marginTop: 2 },
  tabSwitcher: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  audioScroll: {
    flex: 1,
    width: '100%',
  },
  lyricsArea: {
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 150,
    alignItems: 'center',
  },
  lyricsText: {
    fontFamily: 'Outfit-Bold',
    textAlign: 'center',
    opacity: 0.95,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
    letterSpacing: 0.2,
  },
  miniQueue: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  videoLyricsContainer: {
    paddingHorizontal: 24,
    marginTop: 10,
    paddingBottom: 100,
  },
  fontSizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 30,
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  fontSizeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  fontSizeLabel: {
    fontSize: 10,
    fontFamily: 'Outfit-Black',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    opacity: 0.5,
  }
});

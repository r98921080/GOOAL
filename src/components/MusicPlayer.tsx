import React, { useEffect, useRef } from 'react';
import { AppSettings } from '../types';

interface MusicPlayerProps {
  settings: AppSettings;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ settings }) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      if (settings.musicEnabled && settings.currentMusicUrl) {
        audioRef.current.play().catch(e => console.log('Autoplay blocked', e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [settings.musicEnabled, settings.currentMusicUrl]);

  if (!settings.currentMusicUrl) return null;

  return (
    <audio 
      ref={audioRef}
      src={settings.currentMusicUrl}
      loop
      controls={false}
      style={{ display: 'none' }}
    />
  );
};

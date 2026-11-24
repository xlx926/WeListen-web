import type { ReactNode } from "react";

export type NavPage = "search" | "charts" | "favorites" | "playlist" | "upload" | "profile";

export interface PlayRecord {
  id: string;
  song: Song;
  playedAt: string;
}

export interface Artist {
  id: string;
  name: string;
  songCount: number;
  followed: boolean;
}

export interface UploadedSong {
  id: string;
  title: string;
  artist: string;
  status: "online" | "offline";
  uploadedAt: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  duration?: string;
  reason?: string;
  matched?: boolean;
  cover?: ReactNode;
  source?: "netease" | "local";
  playCount?: number;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  songCount: number;
  songs: Song[];
}
